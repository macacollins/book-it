import { useState, useEffect } from 'react';
import { calculateSlimRepertoire } from '../integrations/calculateSlimRepertoire';
import { UploadedPGNClient } from '../database/UploadedPGNClient';

interface UseSlimRepertoireResult {
  repertoire: Record<string, string[]> | null;
  positionNotes: Record<string, string>;
  loading: boolean;
  error: string | null;
}

const CACHE_PREFIX = 'SLIM_REPERTOIRE_CACHE_';
const NOTES_PREFIX = 'SLIM_REPERTOIRE_NOTES_';

export function useSlimRepertoire(repertoireName: string | null): UseSlimRepertoireResult {
  const [repertoire, setRepertoire] = useState<Record<string, string[]> | null>(null);
  const [positionNotes, setPositionNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repertoireName) {
      setRepertoire(null);
      setPositionNotes({});
      return;
    }

    const loadRepertoire = async () => {
      try {
        setLoading(true);
        setError(null);

        const cacheKey = CACHE_PREFIX + repertoireName;
        const notesKey = NOTES_PREFIX + repertoireName;

        // Check localStorage for cached repertoire
        const cachedRepertoire = localStorage.getItem(cacheKey);
        const cachedNotes = localStorage.getItem(notesKey);

        if (cachedRepertoire) {
          console.log(`Loading cached repertoire for: ${repertoireName}`);
          const parsedRepertoire = JSON.parse(cachedRepertoire);
          const parsedNotes = cachedNotes ? JSON.parse(cachedNotes) : {};
          
          setRepertoire(parsedRepertoire);
          setPositionNotes(parsedNotes);
          setLoading(false);
          return;
        }

        // Not in cache, need to calculate
        console.log(`No cache found, calculating repertoire for: ${repertoireName}`);
        
        // Fetch the PGN from database
        const uploadedPGNs = await UploadedPGNClient.getByFilename(repertoireName);
        
        if (!uploadedPGNs || uploadedPGNs.length === 0) {
          throw new Error(`Repertoire not found: ${repertoireName}`);
        }

        const pgnContent = uploadedPGNs[0].content;
        
        // Track notes as they're set during calculation
        const notes: Record<string, string> = {};
        const setComments = (fen: string, _repertoireName: string, comments: any[]) => {
          const commentText = comments.map(c => c.text || c).join(' ');
          notes[fen] = commentText;
        };

        const startTime = performance.now();
        const calculatedRepertoire = calculateSlimRepertoire(pgnContent, repertoireName, setComments);
        const endTime = performance.now();
        console.log(`Calculated repertoire in ${(endTime - startTime).toFixed(2)}ms`);

        // Store in localStorage
        localStorage.setItem(cacheKey, JSON.stringify(calculatedRepertoire));
        localStorage.setItem(notesKey, JSON.stringify(notes));

        setRepertoire(calculatedRepertoire);
        setPositionNotes(notes);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading repertoire';
        setError(errorMessage);
        console.error('Error loading repertoire:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRepertoire();
  }, [repertoireName]);

  return { repertoire, positionNotes, loading, error };
}

// Utility function to clear cache for a specific repertoire
export function clearRepertoireCache(repertoireName: string) {
  const cacheKey = CACHE_PREFIX + repertoireName;
  const notesKey = NOTES_PREFIX + repertoireName;
  localStorage.removeItem(cacheKey);
  localStorage.removeItem(notesKey);
}

// Utility function to clear all repertoire caches
export function clearAllRepertoireCaches() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX) || key.startsWith(NOTES_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
