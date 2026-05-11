import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { GradualRepertoire } from "../database/types";
import { RepertoireSetupResult } from "./RepertoireSetupForm";

interface ImportRepertoireDialogProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: (result: RepertoireSetupResult) => void;
}

export const ImportRepertoireDialog: React.FC<ImportRepertoireDialogProps> = ({
  visible,
  onHide,
  onConfirm,
}) => {
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = async () => {
    setImportError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(importJson);
    } catch {
      setImportError("Invalid JSON.");
      return;
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setImportError("Expected a JSON object.");
      return;
    }

    const obj = parsed as Record<string, unknown>;

    if (typeof obj.name !== "string" || !obj.name.trim()) {
      setImportError('Missing or invalid "name" (string).');
      return;
    }
    if (obj.color !== "white" && obj.color !== "black") {
      setImportError('Missing or invalid "color" (must be "white" or "black").');
      return;
    }
    if (typeof obj.startingFEN !== "string" || !obj.startingFEN.trim()) {
      setImportError('Missing or invalid "startingFEN" (string).');
      return;
    }
    if (!Array.isArray(obj.lines)) {
      setImportError('Missing or invalid "lines" (must be an array).');
      return;
    }
    for (let i = 0; i < obj.lines.length; i++) {
      if (
        !Array.isArray(obj.lines[i]) ||
        !(obj.lines[i] as unknown[]).every((m) => typeof m === "string")
      ) {
        setImportError(`lines[${i}] must be an array of SAN move strings.`);
        return;
      }
    }

    const startingMovesFromImport: string[] =
      Array.isArray(obj.startingMoves) &&
      (obj.startingMoves as unknown[]).every((m) => typeof m === "string")
        ? (obj.startingMoves as string[])
        : [];

    const id = crypto.randomUUID();
    const repertoire: GradualRepertoire = {
      id,
      name: obj.name,
      color: obj.color,
      startingFEN: obj.startingFEN,
      startingMoves: startingMovesFromImport,
      sourceRepertoireId:
        typeof obj.sourceRepertoireId === "string" ? obj.sourceRepertoireId : null,
      lines: obj.lines as string[][],
      timestamp: Date.now(),
      coverageDepthPlies:
        typeof obj.coverageDepthPlies === "number" ? obj.coverageDepthPlies : 7,
      minimumGamesThreshold:
        typeof obj.minimumGamesThreshold === "number" ? obj.minimumGamesThreshold : 5,
      cachedCoveragePercent: null,
    };

    await GradualRepertoireClient.insert(repertoire);
    onConfirm({
      id,
      name: repertoire.name,
      color: repertoire.color,
      startingFEN: repertoire.startingFEN,
      startingMoves: repertoire.startingMoves,
      sourceRepertoireId: repertoire.sourceRepertoireId,
    });
    setImportJson("");
    onHide();
  };

  return (
    <Dialog
      header="Import Repertoire from JSON"
      visible={visible}
      onHide={onHide}
      style={{ width: "520px" }}
      modal
    >
      <div className="field mb-3">
        <label htmlFor="import-json" className="block mb-1">
          Repertoire JSON
        </label>
        <InputTextarea
          id="import-json"
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          rows={10}
          className="w-full"
          placeholder='{"name": "...", "color": "white", "startingFEN": "...", "lines": [...]}'
        />
        {importError && (
          <small className="p-error block mt-1">{importError}</small>
        )}
      </div>

      <div className="flex justify-content-end gap-2 mt-3">
        <Button label="Cancel" className="p-button-text" onClick={onHide} />
        <Button
          label="Import Repertoire"
          icon="bi bi-upload"
          onClick={handleImport}
          disabled={importJson.trim() === ""}
        />
      </div>
    </Dialog>
  );
};
