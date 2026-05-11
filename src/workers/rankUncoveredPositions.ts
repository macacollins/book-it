import { Chess } from "chess.js";
import { GradualRepertoire, RepertoireColor } from "../database/types";
import { fetchExplorerData } from "./frequencyAnalysisCore";
import { UncoveredPosition } from "./uncoveredPositionsTypes";

function isColorTurn(fen: string, color: RepertoireColor): boolean {
  const sideToMove = fen.split(" ")[1];
  return (
    (sideToMove === "w" && color === "white") ||
    (sideToMove === "b" && color === "black")
  );
}

/**
 * Finds all opponent moves that are NOT covered by the repertoire, sorted by
 * total Lichess games descending (highest-priority gap first).
 *
 * Algorithm (two-phase):
 *
 * Phase 1 – Traverse the repertoire lines from startingFEN up to
 * coverageDepthPlies and collect every opponent-turn FEN that appears, along
 * with which opponent moves are already covered in the lines.
 *
 * Phase 2 – Fetch Lichess opening-explorer data for each collected opponent
 * FEN. For every Lichess move that is NOT in the covered set, record an
 * UncoveredPosition for the resulting position. Positions below the
 * minimumGamesThreshold are skipped.
 */
export async function rankUncoveredPositions(
  repertoire: GradualRepertoire,
  token: string,
  onProgress?: (completed: number, total: number) => void,
): Promise<UncoveredPosition[]> {
  const maxDepth = repertoire.coverageDepthPlies ?? 7;
  const minGames = repertoire.minimumGamesThreshold ?? 5;
  const color = repertoire.color;
  const startingFEN = repertoire.startingFEN;
  const lines = repertoire.lines;

  // ── Phase 1: collect opponent-turn positions from the repertoire lines ───

  type OpponentEntry = {
    path: string[]; // moves from startingFEN to reach this FEN
    coveredMoves: Set<string>; // opponent moves that ARE in our lines
  };

  const opponentPositions = new Map<string, OpponentEntry>();

  for (const line of lines) {
    const chess = new Chess(startingFEN);
    for (let i = 0; i < Math.min(line.length, maxDepth); i++) {
      const fen = chess.fen();
      const san = line[i];

      if (!isColorTurn(fen, color)) {
        // Opponent's turn – record path + covered move
        if (!opponentPositions.has(fen)) {
          opponentPositions.set(fen, {
            path: line.slice(0, i),
            coveredMoves: new Set(),
          });
        }
        opponentPositions.get(fen)!.coveredMoves.add(san);
      }

      try {
        chess.move(san);
      } catch {
        break;
      }
    }
  }

  // ── Phase 2: fetch Lichess data and build uncovered positions ────────────

  const opponentArray = Array.from(opponentPositions.entries());
  const lichessCache = new Map<
    string,
    Awaited<ReturnType<typeof fetchExplorerData>>
  >();

  for (let i = 0; i < opponentArray.length; i++) {
    onProgress?.(i, opponentArray.length);
    const [fen] = opponentArray[i];
    try {
      const data = await fetchExplorerData(fen, token);
      lichessCache.set(fen, data);
    } catch (e) {
      console.error("rankUncoveredPositions: failed to fetch FEN", fen, e);
    }
  }
  onProgress?.(opponentArray.length, opponentArray.length);

  // ── Phase 3: identify uncovered moves ────────────────────────────────────

  // Keyed by the resulting FEN to deduplicate transpositions.
  const uncoveredMap = new Map<string, UncoveredPosition>();

  for (const [fen, entry] of opponentPositions) {
    const data = lichessCache.get(fen);
    if (!data) continue;

    for (const move of data.moves) {
      const games = move.white + move.draws + move.black;
      if (games < minGames) continue;
      if (entry.coveredMoves.has(move.san)) continue;

      try {
        const chess = new Chess(fen);
        chess.move(move.san);
        const resultingFen = chess.fen();

        // Keep first occurrence (any valid path is usable for navigation).
        if (!uncoveredMap.has(resultingFen)) {
          uncoveredMap.set(resultingFen, {
            fen: resultingFen,
            startingMoves: [...entry.path, move.san],
            numberGames: games,
          });
        }
      } catch {
        // skip invalid moves from explorer data
      }
    }
  }

  return Array.from(uncoveredMap.values()).sort(
    (a, b) => b.numberGames - a.numberGames,
  );
}
