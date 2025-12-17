import { UploadedPGN, UploadedPGNClient, PGNType } from './index';

export interface UploadPGNResult {
  success: boolean;
  filename?: string;
  error?: string;
}

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
};

export const uploadPGNFile = async (
  file: File,
  pgnType: PGNType
): Promise<UploadPGNResult> => {
  try {
    const fileContent = await readFileContent(file);
    
    const uploadedPGN: UploadedPGN = {
      id: `upload-${Date.now()}`,
      filename: file.name,
      content: fileContent,
      type: pgnType,
    };

    await UploadedPGNClient.insert(uploadedPGN);
    
    return {
      success: true,
      filename: file.name
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
};
