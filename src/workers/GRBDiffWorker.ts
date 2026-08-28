import { Chess } from "chess.js";
import { matchGameToGRB } from "../analysis/matchGameToGRB";
import {
  GRBDiffWorkerInbound,
  GRBDiffWorkerOutbound,
  GRBGameRow,
} from "./grbDiffTypes";

const ctx: Worker = self as unknown as Worker;

function getOpponentFromPGN(pgn: string, usernames: string[]): string {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const headers = chess.header();
    const white = headers["White"] || "";
    const black = headers["Black"] || "";
    const normalized = usernames.map((u) => u.trim().toLowerCase());
    if (normalized.some((u) => u === white.toLowerCase())) return black;
    if (normalized.some((u) => u === black.toLowerCase())) return white;
    return black || "Unknown";
  } catch {
    return "Unknown";
  }
}

ctx.onmessage = (event: MessageEvent<GRBDiffWorkerInbound>) => {
  const message = event.data;
  if (message.type !== "ANALYZE_GRB_DIFF") return;

  const { games, grbs, usernames } = message;

  try {
    for (const game of games) {
      const match = matchGameToGRB(game, grbs, usernames);
      const opponent = match
        ? match.opponent
        : getOpponentFromPGN(game.pgn, usernames);
      const row: GRBGameRow = {
        gameId: game.id,
        gameTimestamp: game.timestamp,
        opponent: opponent || "Unknown",
        match,
        savedGame: game,
      };
      ctx.postMessage({
        type: "GRB_DIFF_ROW",
        row,
      } satisfies GRBDiffWorkerOutbound);
    }

    ctx.postMessage({
      type: "GRB_DIFF_COMPLETE",
    } satisfies GRBDiffWorkerOutbound);
  } catch (err) {
    ctx.postMessage({
      type: "GRB_DIFF_ERROR",
      error: err instanceof Error ? err.message : String(err),
    } satisfies GRBDiffWorkerOutbound);
  }
};
