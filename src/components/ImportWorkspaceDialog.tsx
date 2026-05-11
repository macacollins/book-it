import React, { useState, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Steps } from "primereact/steps";
import { Toast } from "primereact/toast";
import { GradualRepertoire, UploadedPGN } from "../database/types";
import { WorkspaceExport } from "../types/WorkspaceExport";
import { RepertoireImportRow, PGNImportRow } from "../types/importWorkspaceTypes";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { UploadedPGNClient } from "../database/UploadedPGNClient";
import { ImportWorkspaceStep1 } from "./ImportWorkspaceStep1";
import { ImportWorkspaceStep2 } from "./ImportWorkspaceStep2";
import { ImportWorkspaceStep3 } from "./ImportWorkspaceStep3";

interface ImportWorkspaceDialogProps {
  visible: boolean;
  onHide: () => void;
}

const STEPS = [{ label: "Upload" }, { label: "Review" }, { label: "Confirm" }];

export const ImportWorkspaceDialog: React.FC<ImportWorkspaceDialogProps> = ({
  visible,
  onHide,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [workspace, setWorkspace] = useState<WorkspaceExport | null>(null);
  const [repertoireRows, setRepertoireRows] = useState<RepertoireImportRow[]>(
    [],
  );
  const [pgnRows, setPGNRows] = useState<PGNImportRow[]>([]);
  const [existingRepertoires, setExistingRepertoires] = useState<
    GradualRepertoire[]
  >([]);
  const [existingPGNs, setExistingPGNs] = useState<UploadedPGN[]>([]);
  const [importing, setImporting] = useState(false);
  const toast = useRef<Toast>(null);

  const resetState = () => {
    setActiveStep(0);
    setWorkspace(null);
    setRepertoireRows([]);
    setPGNRows([]);
    setExistingRepertoires([]);
    setExistingPGNs([]);
  };

  const handleHide = () => {
    resetState();
    onHide();
  };

  const handleWorkspaceParsed = (ws: WorkspaceExport) => {
    setWorkspace(ws);
    setActiveStep(1);
  };

  const handleStep2Next = (
    rows: RepertoireImportRow[],
    pgns: PGNImportRow[],
    existingReps: GradualRepertoire[],
    existingPGNList: UploadedPGN[],
  ) => {
    setRepertoireRows(rows);
    setPGNRows(pgns);
    setExistingRepertoires(existingReps);
    setExistingPGNs(existingPGNList);
    setActiveStep(2);
  };

  const handleImport = async () => {
    setImporting(true);
    let repsAdded = 0;
    let repsUpdated = 0;
    let pgnsAdded = 0;
    let pgnsUpdated = 0;

    try {
      // Update/add PGNs first so that sourceRepertoireId references resolve
      for (const row of pgnRows) {
        if (!row.shouldImport) continue;
        if (row.shouldMerge && row.mergeTargetId) {
          await UploadedPGNClient.update(row.mergeTargetId, {
            filename: row.incoming.filename,
            content: row.incoming.content,
            type: row.incoming.type,
          });
          pgnsUpdated++;
        } else if (!row.shouldMerge) {
          await UploadedPGNClient.insert({
            ...row.incoming,
            id: crypto.randomUUID(),
          });
          pgnsAdded++;
        }
      }

      // Update/add GradualRepertoires
      for (const row of repertoireRows) {
        if (!row.shouldImport) continue;
        if (row.shouldMerge && row.mergeTargetId) {
          await GradualRepertoireClient.updateMetadata(row.mergeTargetId, {
            name: row.incoming.name,
            startingFEN: row.incoming.startingFEN,
            startingMoves: row.incoming.startingMoves,
            sourceRepertoireId: row.incoming.sourceRepertoireId,
            coverageDepthPlies: row.incoming.coverageDepthPlies,
            minimumGamesThreshold: row.incoming.minimumGamesThreshold,
          });
          await GradualRepertoireClient.updateLines(
            row.mergeTargetId,
            row.incoming.lines,
          );
          repsUpdated++;
        } else if (!row.shouldMerge) {
          await GradualRepertoireClient.insert({
            ...row.incoming,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            cachedCoveragePercent: null,
          });
          repsAdded++;
        }
      }

      const parts: string[] = [];
      if (repsAdded)
        parts.push(
          `${repsAdded} new repertoire${repsAdded !== 1 ? "s" : ""}`,
        );
      if (repsUpdated)
        parts.push(
          `${repsUpdated} updated repertoire${repsUpdated !== 1 ? "s" : ""}`,
        );
      if (pgnsAdded)
        parts.push(`${pgnsAdded} new PGN file${pgnsAdded !== 1 ? "s" : ""}`);
      if (pgnsUpdated)
        parts.push(
          `${pgnsUpdated} updated PGN file${pgnsUpdated !== 1 ? "s" : ""}`,
        );
      const summary = parts.length ? parts.join(", ") : "nothing to import";

      toast.current?.show({
        severity: "success",
        summary: "Import Complete",
        detail: `Imported: ${summary}.`,
        life: 6000,
      });
      handleHide();
    } catch (err) {
      console.error("Import failed:", err);
      toast.current?.show({
        severity: "error",
        summary: "Import Failed",
        detail:
          "An error occurred during import. Some items may not have been saved.",
        life: 6000,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Import Workspace"
        visible={visible}
        onHide={handleHide}
        style={{ width: "56rem" }}
        modal
      >
        <div className="flex flex-column gap-4">
          <Steps model={STEPS} activeIndex={activeStep} readOnly />
          <div>
            {activeStep === 0 && (
              <ImportWorkspaceStep1
                onWorkspaceParsed={handleWorkspaceParsed}
              />
            )}
            {activeStep === 1 && workspace && (
              <ImportWorkspaceStep2
                workspace={workspace}
                onNext={handleStep2Next}
              />
            )}
            {activeStep === 2 && (
              <ImportWorkspaceStep3
                repertoireRows={repertoireRows}
                pgnRows={pgnRows}
                importing={importing}
                onImport={handleImport}
              />
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
};
