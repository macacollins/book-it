import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { GradualRepertoire, UploadedPGN } from "../database/types";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { UploadedPGNClient } from "../database/UploadedPGNClient";
import { WorkspaceExport } from "../types/WorkspaceExport";

interface ExportWorkspaceDialogProps {
  visible: boolean;
  onHide: () => void;
}

export const ExportWorkspaceDialog: React.FC<ExportWorkspaceDialogProps> = ({
  visible,
  onHide,
}) => {
  const [name, setName] = useState("My Workspace");
  const [gradualRepertoires, setGradualRepertoires] = useState<GradualRepertoire[]>([]);
  const [uploadedPGNs, setUploadedPGNs] = useState<UploadedPGN[]>([]);
  const [selectedRepertoireIds, setSelectedRepertoireIds] = useState<Set<string>>(new Set());
  const [selectedPGNIds, setSelectedPGNIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) return;
    Promise.all([
      GradualRepertoireClient.getAll(),
      UploadedPGNClient.getAll(),
    ]).then(([reps, pgns]) => {
      setGradualRepertoires(reps);
      setUploadedPGNs(pgns);
      setSelectedRepertoireIds(new Set(reps.map((r) => r.id)));
      setSelectedPGNIds(new Set(pgns.map((p) => p.id)));
    });
  }, [visible]);

  /** PGN ids that must be included because they are source repertoires of selected gradual repertoires */
  const forcedPGNIds = new Set<string>();
  for (const rep of gradualRepertoires) {
    if (rep.sourceRepertoireId && selectedRepertoireIds.has(rep.id)) {
      forcedPGNIds.add(rep.sourceRepertoireId);
    }
  }

  const toggleRepertoire = (id: string) => {
    setSelectedRepertoireIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePGN = (id: string) => {
    if (forcedPGNIds.has(id)) return;
    setSelectedPGNIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const exportedRepertoires = gradualRepertoires.filter((r) =>
      selectedRepertoireIds.has(r.id),
    );
    const allSelectedPGNIds = new Set([...selectedPGNIds, ...forcedPGNIds]);
    const exportedPGNs = uploadedPGNs.filter((p) => allSelectedPGNIds.has(p.id));

    const workspace: WorkspaceExport = {
      name,
      exportDate: new Date().toISOString(),
      gradualRepertoires: exportedRepertoires,
      uploadedPGNs: exportedPGNs,
    };

    const blob = new Blob([JSON.stringify(workspace, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onHide();
  };

  const footer = (
    <div className="flex gap-2 justify-content-end">
      <Button label="Cancel" className="p-button-text" onClick={onHide} />
      <Button
        label="Export"
        icon="bi bi-download"
        onClick={handleExport}
        disabled={selectedRepertoireIds.size === 0 && selectedPGNIds.size === 0}
      />
    </div>
  );

  return (
    <Dialog
      header="Export Workspace"
      visible={visible}
      onHide={onHide}
      style={{ width: "30rem" }}
      modal
      footer={footer}
    >
      <div className="flex flex-column gap-4">
        <div>
          <label className="block mb-1 font-semibold">Name</label>
          <InputText
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
            placeholder="Workspace name"
          />
        </div>

        {gradualRepertoires.length > 0 && (
          <div>
            <label className="block mb-2 font-semibold">Gradual Repertoires</label>
            <div className="flex flex-column gap-2">
              {gradualRepertoires.map((rep) => (
                <div key={rep.id} className="flex align-items-center gap-2">
                  <Checkbox
                    inputId={`rep-${rep.id}`}
                    checked={selectedRepertoireIds.has(rep.id)}
                    onChange={() => toggleRepertoire(rep.id)}
                  />
                  <label htmlFor={`rep-${rep.id}`} className="cursor-pointer">
                    {rep.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedPGNs.length > 0 && (
          <div>
            <label className="block mb-2 font-semibold">Uploaded PGN Files</label>
            <div className="flex flex-column gap-2">
              {uploadedPGNs.map((pgn) => {
                const forced = forcedPGNIds.has(pgn.id);
                const checked = forced || selectedPGNIds.has(pgn.id);
                return (
                  <div key={pgn.id} className="flex align-items-center gap-2">
                    <Checkbox
                      inputId={`pgn-${pgn.id}`}
                      checked={checked}
                      disabled={forced}
                      onChange={() => togglePGN(pgn.id)}
                    />
                    <label
                      htmlFor={`pgn-${pgn.id}`}
                      className={forced ? "text-color-secondary" : "cursor-pointer"}
                    >
                      {pgn.filename}
                      {forced && (
                        <span className="ml-1 text-xs text-color-secondary">
                          (required by selected repertoire)
                        </span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {gradualRepertoires.length === 0 && uploadedPGNs.length === 0 && (
          <p className="text-color-secondary">
            No repertoires or PGN files found to export.
          </p>
        )}
      </div>
    </Dialog>
  );
};
