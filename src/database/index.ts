// Database client exports
export { db, BookItDatabase } from "./db";
export { SavedGameClient } from "./SavedGameClient";
export { UploadedPGNClient } from "./UploadedPGNClient";
export { GameAnalysisClient } from "./GameAnalysisClient";
export { DrillResultClient } from "./DrillResultClient";
export { TacticsProgressClient } from "./TacticsProgressClient";
export { QueuedPositionClient } from "./QueuedPositionClient";
export { QueuedGameClient } from "./QueuedGameClient";
export { PositionNotesClient } from "./PositionNotesClient";
export { GradualRepertoireClient } from "./GradualRepertoireClient";

// Re-export types for convenience
export type {
  SavedGame,
  UploadedPGN,
  GameAnalysis,
  DrillResult,
  TacticsProgress,
  QueuedPosition,
  QueuedGame,
  PositionNotes,
  GradualRepertoire,
  RepertoireColor,
  GameSource,
  PGNType,
} from "./types";
