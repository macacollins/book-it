import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { PGNType } from './index';
import { uploadPGNFile } from './uploadPGN';

interface PGNUploadProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onUploadComplete: () => void;
}

const pgnTypeOptions = [
  { label: 'Tactics', value: 'tactics' },
  { label: 'Repertoire', value: 'repertoire' },
  { label: 'Games', value: 'games' }
];

export const PGNUpload: React.FC<PGNUploadProps> = ({
  visible,
  onHide,
  onSuccess,
  onError,
  onUploadComplete
}) => {
  const [uploadPGNType, setUploadPGNType] = useState<PGNType | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const handleHide = () => {
    setUploadPGNType(null);
    onHide();
  };

  const handleFileUpload = async (event: any) => {
    const file = event.files[0];
    if (!file) return;

    if (!uploadPGNType) {
      onError('Please select a PGN type before uploading');
      event.options.clear();
      return;
    }

    setUploading(true);
    try {
      const result = await uploadPGNFile(file, uploadPGNType);
      
      if (result.success && result.filename) {
        onSuccess(`Successfully uploaded ${result.filename}`);
        // event.options.clear();
        setUploadPGNType(null);
        onUploadComplete();
        onHide();
      } else {
        onError(result.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      onError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      header="Upload PGN File"
      visible={visible}
      style={{ width: '50vw' }}
      onHide={handleHide}
      modal
    >
      <div className="grid p-fluid">
        <div className="col-12 md:col-6 gap-3 flex flex-column">
          <div>
            The file format is pgn and needs to parse as a 'pgn-parser' compatible PGN.
            
            <b>&nbsp;Importantly,</b> you will need to perform this step before using the PGNs in drills, repertoires, or analyses.
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
            auto={true}
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
            <Message 
              severity="info" 
              text="Uploading file... Please wait." 
            />
          </div>
        )}
      </div>
    </Dialog>
  );
};
