import { GradualRepertoire } from "../database/types";
import { UploadedPGN } from "../database/types";

/**
 * A portable snapshot of a user's workspace that can be exported to JSON
 * and later re-imported on a different device or after a fresh install.
 */
export interface WorkspaceExport {
  /** Human-readable label for the workspace snapshot */
  name: string;
  /** ISO 8601 timestamp of when the export was created */
  exportDate: string;
  /** Gradual repertoire records included in this export */
  gradualRepertoires: GradualRepertoire[];
  /** Uploaded PGN file records included in this export */
  uploadedPGNs: UploadedPGN[];
}
