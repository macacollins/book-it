/** A position that the opponent can reach but is not covered by the repertoire. */
export interface UncoveredPosition {
  /** FEN after the opponent's uncovered move (our turn to respond). */
  fen: string;
  /** SAN moves from the repertoire's startingFEN to reach this position. */
  startingMoves: string[];
  /** Total Lichess games recorded at this position. */
  numberGames: number;
}

// ─── Worker messages ───────────────────────────────────────────────────────

export interface UncoveredPositionsRequest {
  type: "RANK_UNCOVERED_POSITIONS";
  repertoireId: string;
  token: string;
}

export interface UncoveredPositionsResult {
  type: "UNCOVERED_POSITIONS_RESULT";
  positions: UncoveredPosition[];
}

export interface UncoveredPositionsProgress {
  type: "UNCOVERED_POSITIONS_PROGRESS";
  completed: number;
  total: number;
}

export interface UncoveredPositionsError {
  type: "UNCOVERED_POSITIONS_ERROR";
  error: string;
}

export type UncoveredPositionsWorkerInbound = UncoveredPositionsRequest;

export type UncoveredPositionsWorkerOutbound =
  | UncoveredPositionsResult
  | UncoveredPositionsProgress
  | UncoveredPositionsError;
