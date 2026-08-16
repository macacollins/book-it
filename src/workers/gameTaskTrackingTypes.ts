// Inbound message from main thread to the worker
export interface StartGameTaskTrackingRequest {
  type: "START_GAME_TASK_TRACKING";
  usernames: string[]; // chess.com and/or lichess usernames
  token: string;       // Lichess personal access token (for explorer API)
}

export type GameTaskTrackingWorkerInbound = StartGameTaskTrackingRequest;

// Outbound messages from the worker to the main thread

export interface GameTaskTrackingProgressMessage {
  type: "GAME_TASK_PROGRESS";
  processedGames: number;
  totalGames: number;
  currentGameId: string;
}

export interface GameTaskTrackingCompleteMessage {
  type: "GAME_TASK_COMPLETE";
}

export interface GameTaskTrackingErrorMessage {
  type: "GAME_TASK_ERROR";
  error: string;
}

export type GameTaskTrackingWorkerOutbound =
  | GameTaskTrackingProgressMessage
  | GameTaskTrackingCompleteMessage
  | GameTaskTrackingErrorMessage;
