import { Chess } from "chess.js";
import Repertoire from "../types/Repertoire";
import {
  LichessExplorerResponse,
  MoveFrequencyResult,
} from "./frequencyAnalysisTypes";

export function buildRepertoireFromGradual(
  startingFEN: string,
  lines: string[][],
): Repertoire {
  const repertoire: Repertoire = {};

  for (const moves of lines) {
    const chess = new Chess(startingFEN);

    try {
      for (const san of moves) {
        const fen = chess.fen();
        if (!(fen in repertoire)) {
          repertoire[fen] = [];
        }
        if (!repertoire[fen].includes(san)) {
          repertoire[fen].push(san);
        }
        chess.move(san);
      }
    } catch (e) {
      console.log("error in line", moves, "error", e);
    }

    // Also add the final position so it's recognized as "in repertoire"
    const finalFen = chess.fen();
    if (!(finalFen in repertoire)) {
      repertoire[finalFen] = [];
    }
  }

  console.log("Returning repertoire", repertoire);

  return repertoire;
}

export function processExplorerResponse(
  fen: string,
  explorerData: LichessExplorerResponse,
  repertoire: Repertoire,
): MoveFrequencyResult[] {
  const totalGamesAllMoves = explorerData.moves.reduce(
    (sum, m) => sum + m.white + m.draws + m.black,
    0,
  );

  return explorerData.moves.map((move) => {
    const moveTotal = move.white + move.draws + move.black;
    const percentage =
      totalGamesAllMoves > 0 ? (moveTotal / totalGamesAllMoves) * 100 : 0;
    const winRate = moveTotal > 0 ? (move.white / moveTotal) * 100 : 0;

    // Play the move to get the resulting FEN
    const chess = new Chess(fen);
    chess.move(move.san);
    const resultingFen = chess.fen();

    // Check if this resulting FEN is already in the repertoire
    const inRepertoire = resultingFen in repertoire;

    return {
      san: move.san,
      uci: move.uci,
      resultingFen,
      totalGames: moveTotal,
      percentage,
      winRate,
      inRepertoire,
    };
  });
}

export async function fetchExplorerData(
  fen: string,
  token: string,
): Promise<LichessExplorerResponse> {
  const params = new URLSearchParams({
    variant: "standard",
    fen,
    speeds: "blitz,rapid,classical,correspondence",
    ratings: "1400,1600,1800,2000,2200,2500",
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(
    `https://explorer.lichess.ovh/lichess?${params}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Lichess explorer request failed: ${response.status}`);
  }

  return response.json();
}
