import AnalysisResult from "../types/AnalysisResult";
import { MoveTree } from "../types/MoveTree";

export type GameSource = "chess.com" | "lichess.org" | "manual";

// Saved chess game
// Should support:
// - retrieval by ID
// - insertion
// - Deletion
export interface SavedGame {
  id: string;
  timestamp: number;
  pgn: string;
  source: GameSource;
}

export type PGNType = "tactics" | "repertoire" | "games";

// Uploaded PGN file
// Should support:
// - retrieval by ID
// - insertion
export interface UploadedPGN {
  id: string;
  filename: string;
  content: string;
  type: PGNType;
}

// Automated analysis for a specific game
// Should support:
// - retrieval by gameID
// - retrieval by repertoireID
// - insertion
export interface GameAnalysis {
  gameID: string;
  repertoireID: string; // UploadedPGN ID
  analysisData: AnalysisResult;
}

// How the user did on a specific fen drill
// Should support:
// - retrieval by ID
// - insertion
export interface DrillResult {
  id: string;
  fen: string;
  correct: boolean;
  timeTakenSeconds: number;
  timestamp: number;
}

// Progress tracking for tactics training
// Should support:
// - retrieval by ID
// - insertion
// - updating tacticsSolved and totalTactics
export interface TacticsProgress {
  id: string;
  tacticsSolved: number[]; // indices solved
  totalTactics: number;
  lastSolvedTimestamp: number;
}

// Positions the user wants / needs to study move
// Should support:
// - retrieval by ID
// - insertion
// - updating notes
export interface QueuedPosition {
  id: string;
  fen: string;
  timestamp: number;
  notes: string;
}

// Games the user wants / needs to study
// Should support:
// - retrieval by ID
// - insertion
// - updating notes
export interface QueuedGame {
  id: string;
  gameID: string;
  timestamp: number;
  notes: MoveTree;
}

// Games the user wants / needs to study
// Should support:
// - retrieval by fen
// - insertion
// - updating notes
export interface PositionNotes {
  fen: string;
  notes: string;
  source: string;
  status: "synced" | "not-synced";
}

export type RepertoireColor = "white" | "black";

// A gradually built repertoire
// Should support:
// - retrieval by ID
// - insertion
// - updating lines
export interface GradualRepertoire {
  id: string;
  name: string;
  color: RepertoireColor;
  startingFEN: string;
  startingMoves: string[]; // SAN moves leading to startingFEN
  sourceRepertoireId: string | null; // null if started from scratch
  lines: string[][]; // Lines as arrays of SAN moves
  timestamp: number;
  coverageDepthPlies: number; // max plies to analyse (default 7)
  minimumGamesThreshold: number; // min Lichess games for a move to count (default 5)
  cachedCoveragePercent: number | null; // last computed coverage % for the startingFEN
}
