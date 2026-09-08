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
  requestId: number;
  games: SavedGame[];
  grbs: GradualRepertoire[];
  usernames: string[];
}

export type GRBDiffWorkerInbound = GRBDiffRequest;

// ─── Outbound (worker → main thread) ───────────────────────────────────────

export interface GRBDiffCompleteMessage {
  type: "GRB_DIFF_COMPLETE";
  requestId: number;
  rows: GRBGameRow[];
}

export interface GRBDiffErrorMessage {
  type: "GRB_DIFF_ERROR";
  requestId: number;
  error: string;
}

export type GRBDiffWorkerOutbound =
  | GRBDiffCompleteMessage
  | GRBDiffErrorMessage;
