import { Chess } from "chess.js";
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

  // Find the GRB whose startingMoves is the longest prefix of the game
  let bestGRB: GradualRepertoire | null = null;
  let bestMatchLength = -1;

  for (const grb of colorMatched) {
    const sm = grb.startingMoves;
    if (sm.length > gameSANs.length) continue;

    const isPrefix = sm.every((san, i) => gameSANs[i] === san);
    if (isPrefix && sm.length > bestMatchLength) {
      bestMatchLength = sm.length;
      bestGRB = grb;
    }
  }

  if (!bestGRB) return null;

  // Build the set of covered (normalised) FENs from the GRB's lines
  const coveredFENs = new Set<string>();
  coveredFENs.add(normalizePosition(bestGRB.startingFEN));

  for (const line of bestGRB.lines) {
    const lineChess = new Chess(bestGRB.startingFEN);
    for (const san of line) {
      try {
        lineChess.move(san);
        coveredFENs.add(normalizePosition(lineChess.fen()));
      } catch {
        break;
      }
    }
  }

  // Walk game moves beyond the startingMoves prefix and find the first
  // position that is not covered by the GRB
  const movesFromStart: string[] = [];

  for (let i = bestGRB.startingMoves.length; i < history.length; i++) {
    const move = history[i];

    if (!coveredFENs.has(normalizePosition(move.after))) {
      return {
        matchedGRB: bestGRB,
        beforeFEN: move.before,
        afterFEN: move.after,
        movesToBefore: [...movesFromStart],
        movesToAfter: [...movesFromStart, move.san],
        uncoveredSAN: move.san,
        userColor,
        opponent,
      };
    }

    movesFromStart.push(move.san);
  }

  // The entire game is covered — no divergence
  return null;
}
