// Data structure for game annotations
// Maps FEN positions to user notes
export interface GameNotes {
  [fen: string]: string;
}

/**
 * Looks up game annotations from localStorage for a given Lichess game ID
 * @param lichessId - The Lichess game ID
 * @returns The notes object if found, or an empty object if not found
 */
export function getGameAnnotations(lichessId: string): GameNotes {
  const key = `game-annotations-${lichessId}`;
  
  try {
    const storedValue = localStorage.getItem(key);
    
    if (!storedValue) {
      return {};
    }
    
    const notes: GameNotes = JSON.parse(storedValue);
    return notes;
  } catch (error) {
    console.error(`Failed to parse annotations for game ${lichessId}:`, error);
    return {};
  }
}

export function getNotesWordCount(lichessId: string): number {
  const notes = getGameAnnotations(lichessId);
  let wordCount = 0;

  for (const fen in notes) {
    const fenNotes = notes[fen];
    wordCount += fenNotes.trim().split(/\s+/).length;
  }

  return wordCount;
}

/**
 * Saves game annotations to localStorage for a given Lichess game ID
 * @param lichessId - The Lichess game ID
 * @param notes - The notes object to save
 */
export function saveGameAnnotations(lichessId: string, notes: GameNotes): void {
  const key = `game-annotations-${lichessId}`;
  
  try {
    const serializedNotes = JSON.stringify(notes);
    localStorage.setItem(key, serializedNotes);
  } catch (error) {
    console.error(`Failed to save annotations for game ${lichessId}:`, error);
  }
}