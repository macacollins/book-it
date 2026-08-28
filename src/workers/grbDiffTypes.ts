import { GRBMatchResult } from "../analysis/matchGameToGRB";
import { GradualRepertoire, SavedGame } from "../database/types";

export interface GRBGameRow {
  gameId: string;
  gameTimestamp: number;
  opponent: string;
  match: GRBMatchResult | null;
  savedGame: SavedGame;
}

// ─── Inbound (main thread → worker) ────────────────────────────────────────

export interface GRBDiffRequest {
  type: "ANALYZE_GRB_DIFF";
  games: SavedGame[];
  grbs: GradualRepertoire[];
  usernames: string[];
}

export type GRBDiffWorkerInbound = GRBDiffRequest;

// ─── Outbound (worker → main thread) ───────────────────────────────────────

export interface GRBDiffRowMessage {
  type: "GRB_DIFF_ROW";
  row: GRBGameRow;
}

export interface GRBDiffCompleteMessage {
  type: "GRB_DIFF_COMPLETE";
}

export interface GRBDiffErrorMessage {
  type: "GRB_DIFF_ERROR";
  error: string;
}

export type GRBDiffWorkerOutbound =
  | GRBDiffRowMessage
  | GRBDiffCompleteMessage
  | GRBDiffErrorMessage;
