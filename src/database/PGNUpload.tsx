import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { FileUpload, FileUploadSelectEvent, FileUploadUploadEvent } from "primereact/fileupload";
import { Message } from "primereact/message";
import { PGNType } from "./index";
import { uploadPGNFile } from "./uploadPGN";

interface PGNUploadProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onUploadComplete: () => void;
}

const pgnTypeOptions = [
  { label: "Tactics", value: "tactics" },
  { label: "Repertoire", value: "repertoire" },
  { label: "Games", value: "games" },
];

export const PGNUpload: React.FC<PGNUploadProps> = ({
  visible,
  onHide,
  onSuccess,
  onError,
  onUploadComplete,
}) => {
  const [uploadPGNType, setUploadPGNType] = useState<PGNType | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const handleHide = () => {
    setUploadPGNType(null);
    onHide();
  };

  const handleFileUpload = async (event: FileUploadUploadEvent | FileUploadSelectEvent) => {
    const files = event.files;
    if (!files || files.length === 0) return;

    if (!uploadPGNType) {
      onError("Please select a PGN type before uploading");
      return;
    }

    setUploading(true);
    try {
      const results = await Promise.all(
        files.map((file) => uploadPGNFile(file, uploadPGNType)),
      );

      const failures = results.filter((r) => !r.success);
      const successes = results.filter((r) => r.success && r.filename);

      if (successes.length > 0) {
        const names = successes.map((r) => r.filename).join(", ");
        onSuccess(
          successes.length === 1
            ? `Successfully uploaded ${names}`
            : `Successfully uploaded ${successes.length} files: ${names}`,
        );
        onUploadComplete();
      }

      if (failures.length > 0) {
        const msgs = failures.map((r) => r.error || "Unknown error").join("; ");
        onError(
          failures.length === 1
            ? `Failed to upload file: ${msgs}`
            : `Failed to upload ${failures.length} files: ${msgs}`,
        );
      }

      if (failures.length === 0) {
        setUploadPGNType(null);
        onHide();
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      onError("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      header="Upload PGN File"
      visible={visible}
      style={{ width: "50vw" }}
      onHide={handleHide}
      modal
    >
      <div className="grid p-fluid">
        <div className="col-12 md:col-6 gap-3 flex flex-column">
          <div>
            The file format is pgn and needs to parse as a 'pgn-parser'
            compatible PGN.
            <b>&nbsp;Importantly,</b> you will need to perform this step before
            using the PGNs in drills, repertoires, or analyses.
          </div>
          <div>
            <label htmlFor="upload-pgn-type">PGN Type *</label>
            <Dropdown
              id="upload-pgn-type"
              value={uploadPGNType}
              options={pgnTypeOptions}
              onChange={(e) => setUploadPGNType(e.value)}
              placeholder="Select PGN Type"
            />
          </div>
        </div>
        <div className="col-12">
          <label>Select PGN File</label>
          <FileUpload
            name="pgnFile"
            // accept=".pgn,.txt"
            maxFileSize={10000000} // 10MB limit
            onUpload={handleFileUpload}
            onSelect={handleFileUpload}
            // auto={true}
            multiple
            chooseLabel="Choose PGN File"
            className="mt-2"
            disabled={uploading || !uploadPGNType}
          />
          {!uploadPGNType && (
            <small className="p-error block mt-2">
              Please select a PGN type before uploading
            </small>
          )}
        </div>
        {uploading && (
          <div className="col-12">
            <Message severity="info" text="Uploading file... Please wait." />
          </div>
        )}
      </div>
    </Dialog>
  );
};
