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
    /** The nearest ancestor opponent-turn FEN on the path, or null if none. */
    parentOpponentFen: string | null;
    /** The opponent move played at parentOpponentFen that eventually leads here. */
    moveFromParent: string | null;
  };

  const opponentPositions = new Map<string, OpponentEntry>();

  for (const line of lines) {
    const chess = new Chess(startingFEN);
    // Track the last opponent-turn FEN and the move played from it so we can
    // build the parent → child probability chain.
    let lastOpponentFen: string | null = null;
    let lastOpponentMove: string | null = null;

    for (let i = 0; i < Math.min(line.length, maxDepth); i++) {
      const fen = chess.fen();
      const san = line[i];

      if (!isColorTurn(fen, color)) {
        // Opponent's turn – record path + covered move + ancestry
        if (!opponentPositions.has(fen)) {
          opponentPositions.set(fen, {
            path: line.slice(0, i),
            coveredMoves: new Set(),
            parentOpponentFen: lastOpponentFen,
            moveFromParent: lastOpponentMove,
          });
        }
        opponentPositions.get(fen)!.coveredMoves.add(san);

        // This position becomes the parent for the next opponent-turn FEN.
        lastOpponentFen = fen;
        lastOpponentMove = san;
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

  // ── Phase 2.5: compute probability weights for each opponent-turn FEN ────
  //
  // prob(F) = 1.0                                        if parentOpponentFen is null
  //         = prob(parent) × (parentMove.games / parent.totalGames)  otherwise
  //
  // This captures the likelihood of reaching F given the repertoire lines and
  // the observed Lichess move distribution.

  const probabilities = new Map<string, number>();

  function computeProb(fen: string): number {
    if (probabilities.has(fen)) return probabilities.get(fen)!;

    const entry = opponentPositions.get(fen);
    if (!entry) return 0;

    if (entry.parentOpponentFen === null) {
      // Root: we always start here, so probability is 100 %.
      probabilities.set(fen, 1.0);
      return 1.0;
    }

    const parentData = lichessCache.get(entry.parentOpponentFen);
    if (!parentData) {
      probabilities.set(fen, 0);
      return 0;
    }

    const parentTotal = parentData.moves.reduce(
      (sum, m) => sum + m.white + m.draws + m.black,
      0,
    );
    if (parentTotal === 0) {
      probabilities.set(fen, 0);
      return 0;
    }

    const moveData = parentData.moves.find(
      (m) => m.san === entry.moveFromParent,
    );
    if (!moveData) {
      probabilities.set(fen, 0);
      return 0;
    }

    const moveGames = moveData.white + moveData.draws + moveData.black;
    const prob = computeProb(entry.parentOpponentFen) * (moveGames / parentTotal);
    probabilities.set(fen, prob);
    return prob;
  }

  for (const fen of opponentPositions.keys()) {
    computeProb(fen);
  }

  // ── Phase 3: identify uncovered moves ────────────────────────────────────

  // Keyed by the resulting FEN to deduplicate transpositions.
  const uncoveredMap = new Map<string, UncoveredPosition>();

  for (const [fen, entry] of opponentPositions) {
    const data = lichessCache.get(fen);
    if (!data) continue;

    const totalGames = data.moves.reduce(
      (sum, m) => sum + m.white + m.draws + m.black,
      0,
    );
    const positionProbParent = probabilities.get(fen) ?? 0;

    for (const move of data.moves) {
      const games = move.white + move.draws + move.black;
      if (games < minGames) continue;
      if (entry.coveredMoves.has(move.san)) continue;

      // Weighted score: how likely are we to face this exact uncovered move?
      const weightedScore = positionProbParent * (games / totalGames);
        // totalGames > 0 ?  * (games / totalGames) : 0;

      try {
        const chess = new Chess(fen);
        chess.move(move.san);
        const resultingFen = chess.fen();

        // Keep first occurrence (any valid path is usable for navigation).
        if (!uncoveredMap.has(resultingFen)) {
          uncoveredMap.set(resultingFen, {
            fen: resultingFen,
            startingMoves: [...entry.path, move.san],
            numberGames: weightedScore,
          });
        }
      } catch {
        // skip invalid moves from explorer data
      }
    }
  }

  console.log("Uncovered positions before sorting:", Array.from(uncoveredMap.values()));
  console.log("Probabilities:", Array.from(probabilities.entries()));

  return Array.from(uncoveredMap.values()).sort(
    (a, b) => b.numberGames - a.numberGames,
  );
}
