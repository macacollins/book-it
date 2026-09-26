import { Chess } from "chess.js";
import { matchGameToGRB } from "../analysis/matchGameToGRB";
import {
  GRBDiffWorkerInbound,
  GRBDiffWorkerOutbound,
  GRBGameRow,
} from "./grbDiffTypes";
import { GameAnalysis, GameAnalysisClient, SavedGame } from "../database";

console.log("Starting! GRB Diff worker running.");

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

ctx.onmessage = async (event: MessageEvent<GRBDiffWorkerInbound>) => {
  console.log("Got incoming message", event);
  const message = event.data;
  if (message.type !== "ANALYZE_GRB_DIFF") return;

  const { games, grbs, usernames, requestId } = message;

  let existingAnalysis = await GameAnalysisClient.getAll();
  let seenGames: Record<string, GameAnalysis> = {};
  let matchingGames: Record<string, SavedGame> = {};
  existingAnalysis.forEach((a) => {
    seenGames[a.gameID] = a;
  });

  let filteredGames = games.filter((game) => {
    if (Object.keys(seenGames).includes(game.id)) {
      matchingGames[game.id] = game;
      return false;
    } else {
      return true;
    }
  });

  if (existingAnalysis.length) {
    ctx.postMessage({
      type: "GRB_DIFF_COMPLETE",
      requestId,
      rows: existingAnalysis.map((a) => {
        const match = a.analysisData;
        const opponent = match.opponent;
        return {
          gameId: match.gameID,
          gameTimestamp: matchingGames[match.gameID].timestamp,
          opponent: opponent || "Unknown",
          match,
          savedGame: matchingGames[match.gameID],
        };
      }),
    } satisfies GRBDiffWorkerOutbound);
  }

  try {
    // Time to chunk it out
    // 5 matches UX standards not to overwhelm folks

    filteredGames.sort((a: SavedGame, b: SavedGame) => {
      return a.timestamp > b.timestamp ? -1 : 1;
    });

    let index = 0;
    while (index < filteredGames.length) {
      console.log("Processing diff from index: ", index);
      let partialGames: SavedGame[];
      if (index + 5 > filteredGames.length) {
        partialGames = filteredGames.slice(index);
      } else {
        partialGames = filteredGames.slice(index, index + 5);
      }

      let partialResults = partialGames.map(async (game) => {
        const match = await matchGameToGRB(game, grbs, usernames);
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

      const finalResults = await Promise.all(partialResults);

      ctx.postMessage({
        type: "GRB_DIFF_COMPLETE",
        requestId,
        rows: finalResults,
      } satisfies GRBDiffWorkerOutbound);
      index = index + 5;
    }

    // const rows: GRBGameRow[] = games.map((game) => {
    //   const match = matchGameToGRB(game, grbs, usernames);
    //   const opponent = match
    //     ? match.opponent
    //     : getOpponentFromPGN(game.pgn, usernames);
    //   return {
    //     gameId: game.id,
    //     gameTimestamp: game.timestamp,
    //     opponent: opponent || "Unknown",
    //     match,
    //     savedGame: game,
    //   };
    // });

    // ctx.postMessage({
    //   type: "GRB_DIFF_COMPLETE",
    //   requestId,
    //   rows,
    // } satisfies GRBDiffWorkerOutbound);
  } catch (err) {
    console.log("GRB DIFF ERROR", err);
    debugger;
    ctx.postMessage({
      type: "GRB_DIFF_ERROR",
      requestId,
      error: err instanceof Error ? err.message : String(err),
    } satisfies GRBDiffWorkerOutbound);
  }
};
