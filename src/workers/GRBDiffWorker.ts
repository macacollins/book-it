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

  const { games, grbs, usernames, requestId } = message;

  try {
    const rows: GRBGameRow[] = games.map((game) => {
      const match = matchGameToGRB(game, grbs, usernames);
      const opponent = match
        ? match.opponent
        : getOpponentFromPGN(game.pgn, usernames);
      return {
        gameId: game.id,
        gameTimestamp: game.timestamp,
        opponent: opponent || "Unknown",
        match,
        savedGame: game,
      };
    });

    ctx.postMessage({
      type: "GRB_DIFF_COMPLETE",
      requestId,
      rows,
    } satisfies GRBDiffWorkerOutbound);
  } catch (err) {
    ctx.postMessage({
      type: "GRB_DIFF_ERROR",
      requestId,
      error: err instanceof Error ? err.message : String(err),
    } satisfies GRBDiffWorkerOutbound);
  }
};
