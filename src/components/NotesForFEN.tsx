import React, { useState, useEffect, useRef } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { getNotesForFEN, saveNotesForFEN } from '../services/NotesService';

interface NotesForFENProps {
  fen: string;
  repertoire?: string;
  move?: string;
  originalLocation?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * Component for displaying and editing notes for a specific FEN position.
 * Automatically loads notes when FEN changes and saves after 1 second of inactivity.
 */
export default function NotesForFEN({
  fen,
  repertoire = '',
  move = '',
  originalLocation = 'NotesForFEN Component',
  placeholder = 'Enter notes for this position...',
  rows = 5,
  className = 'col-12',
}: NotesForFENProps) {
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedNotesRef = useRef<string>('');

  // Load notes when FEN changes
  useEffect(() => {
    if (!fen) return;

    const loadNotes = async () => {
      setIsLoading(true);
      try {
        const fetchedNotes = await getNotesForFEN(fen);
        setNotes(fetchedNotes);
        lastSavedNotesRef.current = fetchedNotes;
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [fen]);

  // Handle input changes with auto-save after 1 second
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only save if notes have changed from last saved version
    if (newNotes !== lastSavedNotesRef.current) {
      // Set up new timeout for auto-save
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          const noteData = {
            fen,
            notes: newNotes,
            repertoire,
            move,
            original_location: originalLocation,
          };

          const success = await saveNotesForFEN(noteData);
          if (success) {
            lastSavedNotesRef.current = newNotes;
          } else {
            console.error('Failed to save notes');
          }
        } catch (error) {
          console.error('Error saving notes:', error);
        } finally {
          setIsSaving(false);
        }
      }, 1000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!fen) {
    return (
      <div className={className}>
        <p>No FEN position provided</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <InputTextarea
        value={notes}
        onChange={handleNotesChange}
        rows={rows}
        placeholder={placeholder}
        disabled={isLoading}
        className="w-full"
      />
      {isLoading && (
        <small className="text-muted">Loading notes...</small>
      )}
      {isSaving && (
        <small className="text-muted">Saving notes...</small>
      )}
      {!isLoading && !isSaving && notes !== lastSavedNotesRef.current && (
        <small className="text-muted">Unsaved changes...</small>
      )}
    </div>
  );
}