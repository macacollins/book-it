import { Chess, Color, Move } from "chess.js";
import { GameAnalysis, GradualRepertoire } from "../database/types";
import { SavedGame } from "../database/types";
import { GameAnalysisClient } from "../database";

export interface GRBMatchResult {
  gameID: string;
  matchedGRBName: string;
  matchedGRBID: string;
  beforeFEN: string;
  afterFEN: string;
  /** SAN moves from GRB startingFEN to the position just before the uncovered move */
  movesToBefore: string[];
  /** SAN moves from GRB startingFEN to the position just after the uncovered move */
  movesToAfter: string[];
  uncoveredSAN: string;
  /** Repertoire SAN moves available before the uncovered move */
  expectedSANs: string[];
  userColor: "white" | "black";
  userWon: "yes" | "no" | "draw";
  userDiverged: boolean;
  opponent: string;
  headers: Record<string, string>;
}

/**
 * Strip halfmove clock and fullmove number from FEN so that positions can be
 * compared regardless of how many moves have elapsed in the overall game.
 */
function normalizePosition(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

type VerboseMove = Move;

/**
 * Find the GRB whose startingMoves is the longest prefix of gameSANs.
 */
function findBestGRB(
  gameSANs: string[],
  candidates: GradualRepertoire[],
): GradualRepertoire | null {
  let bestGRB: GradualRepertoire | null = null;
  let bestMatchLength = -1;

  for (const grb of candidates) {
    const sm = grb.startingMoves;
    if (sm.length > gameSANs.length) continue;

    // we want every starting move to be in the set of starting moves
    // but not necessarily in the same order
    // Looking at you Colle System

    const isPrefix = sm.every(
      (san, i) =>
        gameSANs.indexOf(san) < sm.length && gameSANs.indexOf(san) !== -1,
    );
    if (isPrefix && sm.length > bestMatchLength) {
      bestMatchLength = sm.length;
      bestGRB = grb;
    }
  }

  return bestGRB;
}

interface RepertoirePositions {
  coveredFENs: Set<string>;
  movesByFEN: Map<string, Set<string>>;
}

/**
 * Build covered positions and the repertoire moves available from each one.
 */
function buildRepertoirePositions(grb: GradualRepertoire): RepertoirePositions {
  const coveredFENs = new Set<string>();
  const movesByFEN = new Map<string, Set<string>>();
  coveredFENs.add(normalizePosition(grb.startingFEN));

  for (const line of grb.lines) {
    const lineChess = new Chess(grb.startingFEN);
    for (const san of line) {
      try {
        const beforeFEN = normalizePosition(lineChess.fen());
        const repertoireMove = lineChess.move(san, { strict: false });
        const moves = movesByFEN.get(beforeFEN) ?? new Set<string>();
        moves.add(repertoireMove.san);
        movesByFEN.set(beforeFEN, moves);
        coveredFENs.add(normalizePosition(lineChess.fen()));
      } catch {
        break;
      }
    }
  }

  return { coveredFENs, movesByFEN };
}

interface Divergence {
  beforeFEN: string;
  afterFEN: string;
  movesToBefore: string[];
  movesToAfter: string[];
  uncoveredSAN: string;
  expectedSANs: string[];
  userDiverged: boolean;
}

/**
 * Walk game moves beyond the GRB's startingMoves prefix and find the first
 * position that is not covered by any of the GRB's lines.
 */
function findDivergence(
  grb: GradualRepertoire,
  history: VerboseMove[],
  userColor: Color,
): Divergence | null {
  const { coveredFENs, movesByFEN } = buildRepertoirePositions(grb);
  const movesFromStart: string[] = [];

  for (let i = grb.startingMoves.length; i < history.length; i++) {
    const move = history[i];

    if (!coveredFENs.has(normalizePosition(move.after))) {
      return {
        beforeFEN: move.before,
        afterFEN: move.after,
        movesToBefore: [...movesFromStart],
        movesToAfter: [...movesFromStart, move.san],
        uncoveredSAN: move.san,
        expectedSANs: [
          ...(movesByFEN.get(normalizePosition(move.before)) ?? []),
        ],
        userDiverged: move.color === userColor,
      };
    }

    movesFromStart.push(move.san);
  }

  // The entire game is covered — no divergence
  return null;
}

// let cache: Record<string, GRBMatchResult> = {};
// const localStorageCache = window.localStorage.getItem("cachedGRBAnalysis");
// if (localStorageCache) {
//   try {
//     cache = JSON.parse(localStorageCache);
//   } catch (e) {
//     console.log("Unable to load cache.", e);
//   }
// }

async function writeNewItemToDisk(
  gameID: string,
  repertoireID: string,
  analysisData: GRBMatchResult,
) {
  const analysis: GameAnalysis = {
    gameID,
    repertoireID,
    analysisData,
  };

  await GameAnalysisClient.upsert(analysis);
  // window.localStorage.setItem("cachedGRBAnalysis", JSON.stringify(cache));
}

/**
 * Given a saved game and the full list of GradualRepertoires, find the
 * best-matching GRB (longest startingMoves prefix that is also a prefix of the
 * game move sequence) and locate the first position in the game that is not
 * covered by any of that GRB's lines.
 *
 * Returns null when no GRB matches or the entire game is covered.
 *
 * @param game      - The saved game to analyse
 * @param grbs      - All GradualRepertoire records to consider
 * @param usernames - Chess.com and/or Lichess usernames; used to determine
 *                    which side the user played so that colour-filtered GRBs
 *                    can be selected correctly
 */
export async function matchGameToGRB(
  game: SavedGame,
  grbs: GradualRepertoire[],
  usernames: string[],
): Promise<GRBMatchResult | null> {
  const cachedResult = await GameAnalysisClient.getByGameID(game.id);
  if (cachedResult?.length) {
    return cachedResult[0].analysisData;
  }

  const chess = new Chess();
  try {
    chess.loadPgn(game.pgn, { strict: false });
  } catch {
    return null;
  }

  const history = chess.history({ verbose: true });
  const headers = chess.header();
  const whitePlayer = headers["White"] || "";
  const blackPlayer = headers["Black"] || "";

  const result = headers["Result"];

  // Determine which side the user played
  const normalizedUsernames = usernames
    .map((u) => u.trim().toLowerCase())
    .filter(Boolean);

  let userColor: "white" | "black" | null = null;
  let opponent = "";

  if (
    normalizedUsernames.length > 0 &&
    normalizedUsernames.some((u) => u === whitePlayer.toLowerCase())
  ) {
    userColor = "white";
    opponent = blackPlayer;
  } else if (
    normalizedUsernames.length > 0 &&
    normalizedUsernames.some((u) => u === blackPlayer.toLowerCase())
  ) {
    userColor = "black";
    opponent = whitePlayer;
  }

  if (!userColor) return null;

  // Only consider GRBs whose colour matches the user's side
  const colorMatched = grbs.filter((g) => g.color === userColor);

  // Full ordered SAN sequence of the game
  const gameSANs = history.map((m) => m.san);

  const bestGRB = findBestGRB(gameSANs, colorMatched);
  if (!bestGRB) return null;

  const divergence = findDivergence(
    bestGRB,
    history,
    userColor === "black" ? "b" : "w",
  );
  if (!divergence) return null;

  let userWon: "yes" | "no" | "draw";
  if (result === "1-0" && userColor === "white") {
    userWon = "yes";
  } else if (result === "0-1" && userColor === "black") {
    userWon = "yes";
  } else if (result === "0-1" || result === "1-0") {
    userWon = "no";
  } else {
    userWon = "draw";
  }

  const finalResult = {
    gameID: game.id,
    matchedGRBName: bestGRB.name,
    matchedGRBID: bestGRB.id,
    ...divergence,
    userColor,
    opponent,
    userWon,
    headers,
  };

  writeNewItemToDisk(game.id, bestGRB.id, finalResult);
  return finalResult;
}

/**
 * Given a raw PGN string for a single game (of any origin — not necessarily
 * the app user's own game) and the full list of GradualRepertoires, find the
 * best-matching GRB and locate the first uncovered position, exactly like
 * {@link matchGameToGRB} but without any username/colour filtering: every GRB
 * is considered regardless of colour, and the longest startingMoves prefix
 * wins.
 *
 * The returned `userColor` holds the *matched GRB's own* colour (used purely
 * to orient the board display) and `opponent` holds a "White vs Black"
 * string built from the PGN headers, since there is no concept of "the user"
 * for an arbitrary uploaded game.
 *
 * Returns null when the PGN fails to parse, no GRB matches, or the entire
 * game is covered.
 */
export function matchGamePGNToGRB(
  pgn: string,
  grbs: GradualRepertoire[],
): GRBMatchResult | null {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn, { strict: false });
  } catch {
    return null;
  }

  const history = chess.history({ verbose: true });
  const gameSANs = history.map((m) => m.san);

  const bestGRB = findBestGRB(gameSANs, grbs);
  if (!bestGRB) return null;

  const divergence = findDivergence(bestGRB, history, "w");
  if (!divergence) return null;

  const headers = chess.header();
  const white = headers["White"] || "White";
  const black = headers["Black"] || "Black";

  return {
    gameID: "pgn",
    matchedGRB: bestGRB,
    ...divergence,
    userColor: bestGRB.color,
    opponent: `${white} vs ${black}`,
  };
}
