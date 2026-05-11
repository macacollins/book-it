import { GradualRepertoire, UploadedPGN } from "../database/types";

export interface FieldChange {
  name: string;
  beforeValue: string;
  afterValue: string;
}

export interface GradualRepertoireDiff {
  fieldChanges: FieldChange[];
  linesAdded: number;
  linesDeleted: number;
}

export interface UploadedPGNDiff {
  fieldChanges: FieldChange[];
  contentLinesAdded: number;
  contentLinesDeleted: number;
}

// ─── GradualRepertoire diff ────────────────────────────────────────────────

function compareField(
  changes: FieldChange[],
  name: string,
  before: string,
  after: string,
): void {
  if (before !== after) {
    changes.push({ name, beforeValue: before, afterValue: after });
  }
}

function serializeLines(lines: string[][]): Set<string> {
  return new Set(lines.map((line) => line.join(" ")));
}

export function getGradualRepertoireDiff(
  existing: GradualRepertoire,
  incoming: GradualRepertoire,
): GradualRepertoireDiff {
  const fieldChanges: FieldChange[] = [];

  compareField(fieldChanges, "name", existing.name, incoming.name);
  compareField(fieldChanges, "color", existing.color, incoming.color);
  compareField(
    fieldChanges,
    "startingFEN",
    existing.startingFEN,
    incoming.startingFEN,
  );
  compareField(
    fieldChanges,
    "startingMoves",
    existing.startingMoves.join(" "),
    incoming.startingMoves.join(" "),
  );
  compareField(
    fieldChanges,
    "sourceRepertoireId",
    existing.sourceRepertoireId ?? "(none)",
    incoming.sourceRepertoireId ?? "(none)",
  );
  compareField(
    fieldChanges,
    "coverageDepthPlies",
    String(existing.coverageDepthPlies ?? 7),
    String(incoming.coverageDepthPlies ?? 7),
  );
  compareField(
    fieldChanges,
    "minimumGamesThreshold",
    String(existing.minimumGamesThreshold ?? 5),
    String(incoming.minimumGamesThreshold ?? 5),
  );

  const existingLineSet = serializeLines(existing.lines);
  const incomingLineSet = serializeLines(incoming.lines);

  let linesAdded = 0;
  let linesDeleted = 0;
  for (const line of incomingLineSet) {
    if (!existingLineSet.has(line)) linesAdded++;
  }
  for (const line of existingLineSet) {
    if (!incomingLineSet.has(line)) linesDeleted++;
  }

  return { fieldChanges, linesAdded, linesDeleted };
}

export function totalGradualRepertoireChanges(
  diff: GradualRepertoireDiff,
): number {
  return diff.fieldChanges.length + diff.linesAdded + diff.linesDeleted;
}

// ─── UploadedPGN diff ──────────────────────────────────────────────────────

function diffContentLines(
  before: string,
  after: string,
): { added: number; deleted: number } {
  const beforeLines = new Set(
    before
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );
  const afterLines = new Set(
    after
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );

  let added = 0;
  let deleted = 0;
  for (const line of afterLines) {
    if (!beforeLines.has(line)) added++;
  }
  for (const line of beforeLines) {
    if (!afterLines.has(line)) deleted++;
  }
  return { added, deleted };
}

export function getUploadedPGNDiff(
  existing: UploadedPGN,
  incoming: UploadedPGN,
): UploadedPGNDiff {
  const fieldChanges: FieldChange[] = [];
  compareField(
    fieldChanges,
    "filename",
    existing.filename,
    incoming.filename,
  );
  compareField(fieldChanges, "type", existing.type, incoming.type);
  const { added, deleted } = diffContentLines(
    existing.content,
    incoming.content,
  );
  return {
    fieldChanges,
    contentLinesAdded: added,
    contentLinesDeleted: deleted,
  };
}

export function totalUploadedPGNChanges(diff: UploadedPGNDiff): number {
  return (
    diff.fieldChanges.length + diff.contentLinesAdded + diff.contentLinesDeleted
  );
}
