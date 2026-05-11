import { RepertoireColor } from "../database/types";

// Message sent from the main thread to the worker
export interface CoverageAnalysisRequest {
  type: "ANALYZE_COVERAGE";
  repertoireId: string;
  token: string;
  color: RepertoireColor;
}

export type CoverageWorkerInbound = CoverageAnalysisRequest;

// Progress update: how many Lichess requests have completed out of the total
export interface CoverageProgressMessage {
  type: "COVERAGE_PROGRESS";
  completed: number;
  total: number;
}

// Coverage result for a single FEN position (0–100)
export interface CoveragePositionResult {
  type: "COVERAGE_POSITION_RESULT";
  fen: string;
  coverage: number;
  totalGames: number;
  movePath: string[];
}

// Sent once after the source repertoire PGN is parsed.
// Maps each FEN to the list of SAN moves that are covered by the source repertoire.
export interface SourceRepertoireLoadedMessage {
  type: "SOURCE_REPERTOIRE_LOADED";
  sourceMovesFromFen: Record<string, string[]>;
}

// Sent when all positions have been calculated
export interface CoverageCompleteMessage {
  type: "COVERAGE_COMPLETE";
}

export interface CoverageErrorMessage {
  type: "COVERAGE_ERROR";
  error: string;
}

export type CoverageWorkerOutbound =
  | CoverageProgressMessage
  | CoveragePositionResult
  | SourceRepertoireLoadedMessage
  | CoverageCompleteMessage
  | CoverageErrorMessage;
