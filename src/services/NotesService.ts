/**
 * Service for handling notes operations with the localhost notes API
 */

export interface NoteData {
  fen: string;
  move?: string;
  notes: string;
  repertoire?: string;
  original_location?: string;
}

export interface NotesResponse {
  notes?: string;
}

/**
 * Fetches notes for a given FEN position from the notes API
 */
export async function getNotesForFEN(fen: string): Promise<string> {
  try {
    const response = await fetch(`http://localhost:3001/notes?fen=${fen}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NotesResponse = await response.json();
    return data.notes || '';
  } catch (error) {
    console.error('Error fetching notes for FEN:', error);
    return '';
  }
}

/**
 * Saves notes for a given FEN position to the notes API
 */
export async function saveNotesForFEN(noteData: NoteData): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/notes', {
      method: 'POST',
      headers: {
        'Accept': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving notes for FEN:', error);
    return false;
  }
}