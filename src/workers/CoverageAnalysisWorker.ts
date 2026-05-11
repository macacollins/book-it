import { Chess } from "chess.js";
import pgnParser from "pgn-parser";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { UploadedPGNClient } from "../database/UploadedPGNClient";
import { RepertoireColor } from "../database/types";
import { fetchExplorerData } from "./frequencyAnalysisCore";
import { LichessExplorerResponse } from "./frequencyAnalysisTypes";
import {
  CoverageWorkerInbound,
  CoverageWorkerOutbound,
} from "./coverageAnalysisTypes";

const DEFAULT_MAX_PLIES = 7;
const DEFAULT_MIN_GAMES_THRESHOLD = 5;

const ctx: Worker = self as unknown as Worker;

/**
 * Parses a PGN string and builds a map of FEN → SAN moves covered by that
 * repertoire (including all variations / RAVs).
 */
function buildSourceMovesMap(pgnContent: string): Record<string, string[]> {
  const sourceMovesFromFen: Record<string, string[]> = {};

  function recordBranch(moves: any[], chess: Chess): void {
    for (const moveNode of moves) {
      if (!moveNode.move) continue;

      const fen = chess.fen();
      const san: string = moveNode.move;

      if (!sourceMovesFromFen[fen]) sourceMovesFromFen[fen] = [];
      if (!sourceMovesFromFen[fen].includes(san)) {
        sourceMovesFromFen[fen].push(san);
      }

      // Recurse into RAVs (alternative variations) from this position
      if (moveNode.ravs?.length > 0) {
        for (const rav of moveNode.ravs) {
          if (rav.moves?.length > 0) {
            recordBranch(rav.moves, new Chess(fen));
          }
        }
      }

      // Advance the main line
      try {
        chess.move(san);
      } catch {
        break;
      }
    }
  }

  try {
    const parsed = pgnParser.parse(pgnContent);
    for (const pgn of parsed) {
      const chess = new Chess();
      // Honour a FEN header if the game starts from a non-standard position
      const fenHeader = pgn.headers?.find((h: any) => h.name === "FEN");
      if (fenHeader?.value) {
        try {
          chess.load(fenHeader.value);
        } catch {
          // ignore invalid FEN header
        }
      }
      if (pgn.moves?.length > 0) {
        recordBranch(pgn.moves, chess);
      }
    }
  } catch {
    // If the PGN is unparseable, return an empty map
  }

  return sourceMovesFromFen;
}

function isColorTurn(fen: string, color: RepertoireColor): boolean {
  const sideToMove = fen.split(" ")[1];
  return (
    (sideToMove === "w" && color === "white") ||
    (sideToMove === "b" && color === "black")
  );
}

ctx.onmessage = async (event: MessageEvent<CoverageWorkerInbound>) => {
  const message = event.data;
  if (message.type !== "ANALYZE_COVERAGE") return;

  const { repertoireId, token, color } = message;

  try {
    const gradualRepertoire =
      await GradualRepertoireClient.getById(repertoireId);
    if (!gradualRepertoire) {
      ctx.postMessage({
        type: "COVERAGE_ERROR",
        error: "Repertoire not found",
      } as CoverageWorkerOutbound);
      return;
    }

    // Step 0: Load and parse the source repertoire PGN (if one is linked) and
    // post a SOURCE_REPERTOIRE_LOADED message so the UI can show "In Source".

    const MAX_PLIES = gradualRepertoire.coverageDepthPlies ?? DEFAULT_MAX_PLIES;
    const MIN_GAMES_THRESHOLD =
      gradualRepertoire.minimumGamesThreshold ?? DEFAULT_MIN_GAMES_THRESHOLD;
    if (gradualRepertoire.sourceRepertoireId) {
      const sourcePGN = await UploadedPGNClient.getById(
        gradualRepertoire.sourceRepertoireId,
      );
      if (sourcePGN) {
        const sourceMovesFromFen = buildSourceMovesMap(sourcePGN.content);
        ctx.postMessage({
          type: "SOURCE_REPERTOIRE_LOADED",
          sourceMovesFromFen,
        } as CoverageWorkerOutbound);
      }
    }

    // Step 1: Truncate all lines to MAX_PLIES, deduplicate, then remove any
    // line that is a strict prefix of another line in the set.
    function isLineSubsetOf(line: string[], candidate: string[]): boolean {
      if (line.length >= candidate.length) return false;
      return line.every((move, index) => candidate[index] === move);
    }

    const sliced = gradualRepertoire.lines.map((line) =>
      line.slice(0, MAX_PLIES),
    );

    // Deduplicate exact copies first
    const deduped = sliced.filter(
      (line, index, arr) =>
        arr.findIndex((other) => other.join("\0") === line.join("\0")) === index,
    );

    // Remove lines that are strict prefixes of any other line
    const truncatedLines = deduped.filter(
      (line) => !deduped.some((candidate) => isLineSubsetOf(line, candidate)),
    );

    // Step 2: Traverse each line to collect positions.
    // Only opponent-to-move FENs need Lichess data.
    // Terminal FENs (end of each line) are anchored at 100%.
    const opponentFENs = new Set<string>();
    const terminalFENs = new Set<string>();
    // Map: FEN → set of plies (0-based) at which this position appears
    const fenDepths = new Map<string, Set<number>>();
    // Map: FEN → set of our repertoire moves from this position
    const ourMovesFromFen = new Map<string, Set<string>>();
    // Map: FEN → first known SAN path from startingFEN
    const fenToPath = new Map<string, string[]>();

    for (const line of truncatedLines) {
      if (line.length === 0) continue;

      const chess = new Chess(gradualRepertoire.startingFEN);

      for (let i = 0; i < line.length; i++) {
        const fen = chess.fen();

        if (!fenDepths.has(fen)) fenDepths.set(fen, new Set());
        fenDepths.get(fen)!.add(i);

        if (!fenToPath.has(fen)) fenToPath.set(fen, line.slice(0, i));

        if (!isColorTurn(fen, color)) {
          // Opponent to move — we'll fetch Lichess data for this FEN
          opponentFENs.add(fen);
        } else {
          // Our turn — record this as a repertoire move from this position
          if (!ourMovesFromFen.has(fen)) ourMovesFromFen.set(fen, new Set());
          ourMovesFromFen.get(fen)!.add(line[i]);
        }

        try {
          chess.move(line[i]);
        } catch {
          // Invalid move — stop processing this line early
          break;
        }
      }

      // Only anchor positions at 100% when the line reached the depth limit.
      // Lines that are naturally shorter do not get a guaranteed anchor.
      const terminalFen = chess.fen();
    //   if (line.length === MAX_PLIES) {
        terminalFENs.add(terminalFen);
    //   }
      if (!fenDepths.has(terminalFen)) fenDepths.set(terminalFen, new Set());
      fenDepths.get(terminalFen)!.add(line.length);
      if (!fenToPath.has(terminalFen)) fenToPath.set(terminalFen, [...line]);
    }

    // Step 3: Sequentially fetch Lichess explorer data for every
    // opponent-to-move FEN, sending progress updates after each request.
    const opponentFENsArray = Array.from(opponentFENs);
    const explorerDataMap = new Map<string, LichessExplorerResponse>();

    for (let i = 0; i < opponentFENsArray.length; i++) {
      ctx.postMessage({
        type: "COVERAGE_PROGRESS",
        completed: i,
        total: opponentFENsArray.length,
      } as CoverageWorkerOutbound);

      const fen = opponentFENsArray[i];
      try {
        const data = await fetchExplorerData(fen, token);
        explorerDataMap.set(fen, data);
      } catch (e) {
        console.error("Failed to fetch Lichess data for FEN:", fen, e);
      }
    }

    ctx.postMessage({
      type: "COVERAGE_PROGRESS",
      completed: opponentFENsArray.length,
      total: opponentFENsArray.length,
    } as CoverageWorkerOutbound);

    // Build a lookup for total games per opponent FEN from the explorer data.
    const fenTotalGames = new Map<string, number>();
    for (const [fen, data] of explorerDataMap) {
      fenTotalGames.set(fen, data.white + data.draws + data.black);
    }

    // Step 4: Bottom-up coverage calculation, processing one ply at a time
    // from the deepest positions (MAX_PLIES) back to depth 0.
    const coverageCache = new Map<string, number>();

    // Seed all terminal positions at 100% — these are our anchors.
    for (const fen of terminalFENs) {
      coverageCache.set(fen, 100);
      ctx.postMessage({
        type: "COVERAGE_POSITION_RESULT",
        fen,
        coverage: 100,
        totalGames: fenTotalGames.get(fen) ?? 0,
        movePath: fenToPath.get(fen) ?? [],
      } as CoverageWorkerOutbound);
    }

    // Work backwards from MAX_PLIES - 1 down to ply 0.
    for (let depth = MAX_PLIES - 1; depth >= 0; depth--) {
      for (const [fen, depths] of fenDepths) {
        if (!depths.has(depth)) continue;
        // Skip positions already computed (e.g., they were terminal FENs
        // that also appeared at a shallower depth via a transposition).
        if (coverageCache.has(fen)) continue;

        let coverage: number;

        if (!isColorTurn(fen, color)) {
          // Opponent's turn: weighted average of child coverage values,
          // weighted by Lichess game frequency (moves with < 5 games ignored).
          //   numerator   = Σ games(M) × coverage(resultingFen(M))
          //   denominator = Σ games(M)   for all qualifying moves M
          const lichessData = explorerDataMap.get(fen);
          if (!lichessData || lichessData.moves.length === 0) {
            coverage = 0;
          } else {
            let numerator = 0;
            let denominator = 0;

            for (const move of lichessData.moves) {
              const games = move.white + move.draws + move.black;
              if (games < MIN_GAMES_THRESHOLD) continue;

              denominator += games;
              try {
                const chess = new Chess(fen);
                chess.move(move.san);
                const resultingFen = chess.fen();
                const childCoverage = coverageCache.get(resultingFen);
                if (childCoverage !== undefined) {
                  numerator += games * (childCoverage / 100);
                }
                // If resultingFen not in cache → treated as 0%, adds to denominator only
              } catch {
                // Invalid move from Lichess data — skip
              }
            }

            coverage =
              denominator > 0 ? (numerator / denominator) * 100 : 0;
          }
        } else {
          // Our turn: 0% if no repertoire moves exist; otherwise the average
          // coverage of all resulting positions after our moves.
          const ourMoves = ourMovesFromFen.get(fen);
          if (!ourMoves || ourMoves.size === 0) {
            coverage = 0;
          } else {
            let total = 0;
            for (const san of ourMoves) {
              try {
                const chess = new Chess(fen);
                chess.move(san);
                total += coverageCache.get(chess.fen()) ?? 0;
              } catch {
                // skip invalid move
              }
            }
            coverage = total / ourMoves.size;
          }
        }

        coverageCache.set(fen, coverage);
        ctx.postMessage({
          type: "COVERAGE_POSITION_RESULT",
          fen,
          coverage,
          totalGames: fenTotalGames.get(fen) ?? 0,
          movePath: fenToPath.get(fen) ?? [],
        } as CoverageWorkerOutbound);
      }
    }

    ctx.postMessage({ type: "COVERAGE_COMPLETE" } as CoverageWorkerOutbound);
  } catch (err) {
    ctx.postMessage({
      type: "COVERAGE_ERROR",
      error: err instanceof Error ? err.message : String(err),
    } as CoverageWorkerOutbound);
  }
};
