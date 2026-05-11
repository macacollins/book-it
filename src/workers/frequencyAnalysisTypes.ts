// Messages sent from the main thread to the worker
export interface FrequencyAnalysisRequest {
  type: "ANALYZE_FREQUENCY";
  fen: string;
  repertoireId: string;
  token: string;
}

export type FrequencyWorkerInbound = FrequencyAnalysisRequest;

// Individual move result
export interface MoveFrequencyResult {
  san: string;
  uci: string;
  resultingFen: string;
  totalGames: number;
  percentage: number;
  winRate: number;
  inRepertoire: boolean;
}

// Messages sent from the worker to the main thread
export interface FrequencyAnalysisResponse {
  type: "FREQUENCY_ANALYSIS_RESULT";
  fen: string;
  moves: MoveFrequencyResult[];
  coveragePercentage: number;
}

export interface FrequencyAnalysisError {
  type: "FREQUENCY_ANALYSIS_ERROR";
  fen: string;
  error: string;
}

export type FrequencyWorkerOutbound =
  | FrequencyAnalysisResponse
  | FrequencyAnalysisError;

// Lichess Opening Explorer response shape (subset we use)
export interface LichessExplorerMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
}

export interface LichessExplorerResponse {
  white: number;
  draws: number;
  black: number;
  moves: LichessExplorerMove[];
}
