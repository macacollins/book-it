import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { GradualRepertoire, UploadedPGN } from "../database/types";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { UploadedPGNClient } from "../database/UploadedPGNClient";
import { WorkspaceExport } from "../types/WorkspaceExport";
import { RepertoireImportRow, PGNImportRow } from "../types/importWorkspaceTypes";
import {
  getGradualRepertoireDiff,
  getUploadedPGNDiff,
  totalGradualRepertoireChanges,
  totalUploadedPGNChanges,
} from "../analysis/getDiffInformation";

interface ImportWorkspaceStep2Props {
  workspace: WorkspaceExport;
  onNext: (
    repertoireRows: RepertoireImportRow[],
    pgnRows: PGNImportRow[],
    existingRepertoires: GradualRepertoire[],
    existingPGNs: UploadedPGN[],
  ) => void;
}

export const ImportWorkspaceStep2: React.FC<ImportWorkspaceStep2Props> = ({
  workspace,
  onNext,
}) => {
  const [loading, setLoading] = useState(true);
  const [existingRepertoires, setExistingRepertoires] = useState<GradualRepertoire[]>([]);
  const [existingPGNs, setExistingPGNs] = useState<UploadedPGN[]>([]);
  const [repertoireRows, setRepertoireRows] = useState<RepertoireImportRow[]>([]);
  const [pgnRows, setPGNRows] = useState<PGNImportRow[]>([]);

  useEffect(() => {
    Promise.all([
      GradualRepertoireClient.getAll(),
      UploadedPGNClient.getAll(),
    ]).then(([reps, pgns]) => {
      setExistingRepertoires(reps);
      setExistingPGNs(pgns);

      const repRows: RepertoireImportRow[] = workspace.gradualRepertoires.map(
        (incoming) => {
          const match = reps.find((r) => r.name === incoming.name);
          return {
            incoming,
            shouldImport: true,
            shouldMerge: !!match,
            mergeTargetId: match?.id ?? null,
            diff: match ? getGradualRepertoireDiff(match, incoming) : null,
          };
        },
      );

      const pgnRowList: PGNImportRow[] = workspace.uploadedPGNs.map(
        (incoming) => {
          const match = pgns.find((p) => p.filename === incoming.filename);
          return {
            incoming,
            shouldImport: true,
            shouldMerge: !!match,
            mergeTargetId: match?.id ?? null,
            diff: match ? getUploadedPGNDiff(match, incoming) : null,
          };
        },
      );

      setRepertoireRows(repRows);
      setPGNRows(pgnRowList);
      setLoading(false);
    });
  }, [workspace]);

  const updateRepRow = (index: number, changes: Partial<RepertoireImportRow>) => {
    setRepertoireRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...changes };
      return next;
    });
  };

  const updatePGNRow = (index: number, changes: Partial<PGNImportRow>) => {
    setPGNRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...changes };
      return next;
    });
  };

  const handleRepMergeTargetChange = (index: number, targetId: string) => {
    const existing = existingRepertoires.find((r) => r.id === targetId);
    const diff = existing
      ? getGradualRepertoireDiff(existing, repertoireRows[index].incoming)
      : null;
    updateRepRow(index, { mergeTargetId: targetId, diff });
  };

  const handlePGNMergeTargetChange = (index: number, targetId: string) => {
    const existing = existingPGNs.find((p) => p.id === targetId);
    const diff = existing
      ? getUploadedPGNDiff(existing, pgnRows[index].incoming)
      : null;
    updatePGNRow(index, { mergeTargetId: targetId, diff });
  };

  const canProceed = () => {
    for (const row of repertoireRows) {
      if (row.shouldImport && row.shouldMerge && !row.mergeTargetId) return false;
    }
    for (const row of pgnRows) {
      if (row.shouldImport && row.shouldMerge && !row.mergeTargetId) return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex align-items-center justify-content-center p-5">
        <ProgressSpinner />
      </div>
    );
  }

  const repOptions = existingRepertoires.map((r) => ({
    label: r.name,
    value: r.id,
  }));
  const pgnOptions = existingPGNs.map((p) => ({
    label: p.filename,
    value: p.id,
  }));

  const repChangesBody = (row: RepertoireImportRow) => {
    if (!row.shouldMerge || !row.diff) return "—";
    const n = totalGradualRepertoireChanges(row.diff);
    return n === 0 ? "No changes" : String(n);
  };

  const pgnChangesBody = (row: PGNImportRow) => {
    if (!row.shouldMerge || !row.diff) return "—";
    const n = totalUploadedPGNChanges(row.diff);
    return n === 0 ? "No changes" : String(n);
  };

  return (
    <div className="flex flex-column gap-4">
      {workspace.gradualRepertoires.length > 0 && (
        <div>
          <h4 className="mt-0 mb-2">
            Gradual Repertoires ({workspace.gradualRepertoires.length})
          </h4>
          <DataTable value={repertoireRows} size="small" stripedRows>
            <Column
              header="Name"
              body={(row: RepertoireImportRow) => row.incoming.name}
            />
            <Column
              header="Import"
              body={(row: RepertoireImportRow, { rowIndex }) => (
                <Checkbox
                  checked={row.shouldImport}
                  onChange={(e) =>
                    updateRepRow(rowIndex, { shouldImport: !!e.checked })
                  }
                />
              )}
            />
            <Column
              header="Merge"
              body={(row: RepertoireImportRow, { rowIndex }) => (
                <div className="flex align-items-center gap-2">
                  <Checkbox
                    checked={row.shouldMerge}
                    onChange={(e) => {
                      const shouldMerge = !!e.checked;
                      const existing =
                        shouldMerge && row.mergeTargetId
                          ? existingRepertoires.find(
                              (r) => r.id === row.mergeTargetId,
                            )
                          : undefined;
                      updateRepRow(rowIndex, {
                        shouldMerge,
                        mergeTargetId: shouldMerge ? row.mergeTargetId : null,
                        diff: existing
                          ? getGradualRepertoireDiff(existing, row.incoming)
                          : null,
                      });
                    }}
                  />
                  {row.shouldMerge && (
                    <Dropdown
                      value={row.mergeTargetId}
                      options={repOptions}
                      onChange={(e) =>
                        handleRepMergeTargetChange(rowIndex, e.value)
                      }
                      placeholder="Select target"
                      className={!row.mergeTargetId ? "p-invalid" : ""}
                      style={{ minWidth: "180px" }}
                    />
                  )}
                </div>
              )}
            />
            <Column header="# Changes" body={repChangesBody} />
          </DataTable>
        </div>
      )}

      {workspace.uploadedPGNs.length > 0 && (
        <div>
          <h4 className="mt-0 mb-2">
            Uploaded PGN Files ({workspace.uploadedPGNs.length})
          </h4>
          <DataTable value={pgnRows} size="small" stripedRows>
            <Column
              header="Name"
              body={(row: PGNImportRow) => row.incoming.filename}
            />
            <Column
              header="Import"
              body={(row: PGNImportRow, { rowIndex }) => (
                <Checkbox
                  checked={row.shouldImport}
                  onChange={(e) =>
                    updatePGNRow(rowIndex, { shouldImport: !!e.checked })
                  }
                />
              )}
            />
            <Column
              header="Merge"
              body={(row: PGNImportRow, { rowIndex }) => (
                <div className="flex align-items-center gap-2">
                  <Checkbox
                    checked={row.shouldMerge}
                    onChange={(e) => {
                      const shouldMerge = !!e.checked;
                      const existing =
                        shouldMerge && row.mergeTargetId
                          ? existingPGNs.find(
                              (p) => p.id === row.mergeTargetId,
                            )
                          : undefined;
                      updatePGNRow(rowIndex, {
                        shouldMerge,
                        mergeTargetId: shouldMerge ? row.mergeTargetId : null,
                        diff: existing
                          ? getUploadedPGNDiff(existing, row.incoming)
                          : null,
                      });
                    }}
                  />
                  {row.shouldMerge && (
                    <Dropdown
                      value={row.mergeTargetId}
                      options={pgnOptions}
                      onChange={(e) =>
                        handlePGNMergeTargetChange(rowIndex, e.value)
                      }
                      placeholder="Select target"
                      className={!row.mergeTargetId ? "p-invalid" : ""}
                      style={{ minWidth: "180px" }}
                    />
                  )}
                </div>
              )}
            />
            <Column header="# Changes" body={pgnChangesBody} />
          </DataTable>
        </div>
      )}

      <div className="flex justify-content-end">
        <Button
          label="Next"
          icon="bi bi-arrow-right"
          iconPos="right"
          onClick={() =>
            onNext(repertoireRows, pgnRows, existingRepertoires, existingPGNs)
          }
          disabled={!canProceed()}
        />
      </div>
    </div>
  );
};
