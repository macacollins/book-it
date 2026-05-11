import React, { useState } from "react";
import { FileUpload, FileUploadSelectEvent } from "primereact/fileupload";
import { Message } from "primereact/message";
import { WorkspaceExport } from "../types/WorkspaceExport";

interface ImportWorkspaceStep1Props {
  onWorkspaceParsed: (workspace: WorkspaceExport) => void;
}

function isWorkspaceExport(obj: unknown): obj is WorkspaceExport {
  if (typeof obj !== "object" || obj === null) return false;
  const w = obj as Record<string, unknown>;
  return (
    typeof w.name === "string" &&
    typeof w.exportDate === "string" &&
    Array.isArray(w.gradualRepertoires) &&
    Array.isArray(w.uploadedPGNs)
  );
}

export const ImportWorkspaceStep1: React.FC<ImportWorkspaceStep1Props> = ({
  onWorkspaceParsed,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (event: FileUploadSelectEvent) => {
    const file = event.files[0];
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isWorkspaceExport(parsed)) {
        setError(
          "File does not appear to be a valid workspace export. " +
            "Expected fields: name, exportDate, gradualRepertoires, uploadedPGNs.",
        );
        return;
      }
      onWorkspaceParsed(parsed);
    } catch {
      setError(
        "Failed to parse file. Ensure it is a valid workspace export JSON.",
      );
    }
  };

  return (
    <div className="flex flex-column gap-3">
      <p className="m-0 text-color-secondary">
        Select a workspace export file (<code>.json</code>) downloaded from
        Book It! to import your repertoires and PGN files.
      </p>
      <FileUpload
        mode="basic"
        accept=".json,application/json"
        chooseLabel="Choose Workspace File"
        onSelect={handleSelect}
      />
      {error && <Message severity="error" text={error} className="w-full" />}
    </div>
  );
};
