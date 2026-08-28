import { Chess, Move } from "chess.js";
import { GradualRepertoire } from "../database/types";
import { SavedGame } from "../database/types";

export interface GRBMatchResult {
  matchedGRB: GradualRepertoire;
  beforeFEN: string;
  afterFEN: string;
  /** SAN moves from GRB startingFEN to the position just before the uncovered move */
  movesToBefore: string[];
  /** SAN moves from GRB startingFEN to the position just after the uncovered move */
  movesToAfter: string[];
  uncoveredSAN: string;
  userColor: "white" | "black";
  opponent: string;
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

    const isPrefix = sm.every((san, i) => gameSANs[i] === san);
    if (isPrefix && sm.length > bestMatchLength) {
      bestMatchLength = sm.length;
      bestGRB = grb;
    }
  }

  return bestGRB;
}

/**
 * Build the set of covered (normalised) FENs from a GRB's lines.
 */
function buildCoveredFENs(grb: GradualRepertoire): Set<string> {
  const coveredFENs = new Set<string>();
  coveredFENs.add(normalizePosition(grb.startingFEN));

  for (const line of grb.lines) {
    const lineChess = new Chess(grb.startingFEN);
    for (const san of line) {
      try {
        lineChess.move(san);
        coveredFENs.add(normalizePosition(lineChess.fen()));
      } catch {
        break;
      }
    }
  }

  return coveredFENs;
}

interface Divergence {
  beforeFEN: string;
  afterFEN: string;
  movesToBefore: string[];
  movesToAfter: string[];
  uncoveredSAN: string;
}

/**
 * Walk game moves beyond the GRB's startingMoves prefix and find the first
 * position that is not covered by any of the GRB's lines.
 */
function findDivergence(
  grb: GradualRepertoire,
  history: VerboseMove[],
): Divergence | null {
  const coveredFENs = buildCoveredFENs(grb);
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
      };
    }

    movesFromStart.push(move.san);
  }

  // The entire game is covered — no divergence
  return null;
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
export function matchGameToGRB(
  game: SavedGame,
  grbs: GradualRepertoire[],
  usernames: string[],
): GRBMatchResult | null {
  const chess = new Chess();
  try {
    chess.loadPgn(game.pgn);
  } catch {
    return null;
  }

  const history = chess.history({ verbose: true });
  const headers = chess.header();
  const whitePlayer = headers["White"] || "";
  const blackPlayer = headers["Black"] || "";

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

  const divergence = findDivergence(bestGRB, history);
  if (!divergence) return null;

  return {
    matchedGRB: bestGRB,
    ...divergence,
    userColor,
    opponent,
  };
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
    chess.loadPgn(pgn);
  } catch {
    return null;
  }

  const history = chess.history({ verbose: true });
  const gameSANs = history.map((m) => m.san);

  const bestGRB = findBestGRB(gameSANs, grbs);
  if (!bestGRB) return null;

  const divergence = findDivergence(bestGRB, history);
  if (!divergence) return null;

  const headers = chess.header();
  const white = headers["White"] || "White";
  const black = headers["Black"] || "Black";

  return {
    matchedGRB: bestGRB,
    ...divergence,
    userColor: bestGRB.color,
    opponent: `${white} vs ${black}`,
  };
}
