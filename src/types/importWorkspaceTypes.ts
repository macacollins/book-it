import { GradualRepertoire, UploadedPGN } from "../database/types";
import { GradualRepertoireDiff, UploadedPGNDiff } from "../analysis/getDiffInformation";

export interface RepertoireImportRow {
  incoming: GradualRepertoire;
  shouldImport: boolean;
  shouldMerge: boolean;
  /** ID of the existing GradualRepertoire to merge into, or null for a fresh insert */
  mergeTargetId: string | null;
  /** Diff against the current merge target, or null when no target is selected */
  diff: GradualRepertoireDiff | null;
}

export interface PGNImportRow {
  incoming: UploadedPGN;
  shouldImport: boolean;
  shouldMerge: boolean;
  /** ID of the existing UploadedPGN to merge into, or null for a fresh insert */
  mergeTargetId: string | null;
  /** Diff against the current merge target, or null when no target is selected */
  diff: UploadedPGNDiff | null;
}
