/**
 * Represents the progress data for a completed repertoire drill session
 */
export interface DrillCompletionData {
  /** The filename of the repertoire PGN */
  filename: string;
  /** The starting move number used in the drill */
  startingMove: number;
  /** The ending move number used in the drill */
  endingMove: number;
  /** The color drilled (white or black) */
  drillColor: "white" | "black";
  /** ISO timestamp of when the drill was completed */
  completedAt: string;
  /** Number of exercises completed in this session */
  exerciseCount: number;
}

/**
 * Represents a collection of drill completions for a specific repertoire
 */
export interface DrillProgressHistory {
  filename: string;
  completions: DrillCompletionData[];
  lastCompletedAt?: string;
  totalCompletions: number;
}
