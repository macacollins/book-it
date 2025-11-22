import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { UploadedPGNClient } from '../database/UploadedPGNClient';
import { UploadedPGN } from '../database/types';
import pgnParser, { ParsedPGN } from 'pgn-parser';
import ChessBoard from './ChessBoard';
import useWindowSize from '../hooks/useWindowSize';
import { Button } from 'primereact/button';

const SELECTED_TACTICS_PGN_KEY = 'SELECTED_TACTICS_PGN';

export const TacticsPractice = () => {
  const [uploadedPGNs, setUploadedPGNs] = useState<UploadedPGN[]>([]);
  const [selectedPGN, setSelectedPGN] = useState<UploadedPGN | null>(null);
  const [parsedPGNs, setParsedPGNs] = useState<ParsedPGN[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<any>(null);
  const [width, height] = useWindowSize();
  const boardSize = Math.min(width, height) - 20;

  // Load all tactics PGNs from database
  useEffect(() => {
    const loadTacticsPGNs = async () => {
      try {
        setLoading(true);
        const tacticsPGNs = await UploadedPGNClient.getByType('tactics');
        setUploadedPGNs(tacticsPGNs);
        
        // Restore previously selected PGN if available
        const savedFilename = localStorage.getItem(SELECTED_TACTICS_PGN_KEY);
        if (savedFilename && tacticsPGNs.length > 0) {
          const matchingPGN = tacticsPGNs.find(pgn => pgn.filename === savedFilename);
          if (matchingPGN) {
            setSelectedPGN(matchingPGN);
          }
        }
      } catch (err) {
        console.error('Error loading tactics PGNs:', err);
        setError('Failed to load tactics from database');
      } finally {
        setLoading(false);
      }
    };

    loadTacticsPGNs();
  }, []);

  // Parse PGN when selection changes
  useEffect(() => {
    if (selectedPGN) {
      try {
        const parsed = pgnParser.parse(selectedPGN.content);
        setParsedPGNs(parsed);
        setCurrentPuzzleIndex(0);
        setError(null);
      } catch (err) {
        console.error('Error parsing PGN:', err);
        setError('Failed to parse selected PGN file');
        setParsedPGNs([]);
      }
    } else {
      setParsedPGNs([]);
      setCurrentPuzzleIndex(0);
    }
  }, [selectedPGN]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  const pgnOptions = uploadedPGNs.map(pgn => ({
    label: pgn.filename,
    value: pgn
  }));

  const currentFEN = parsedPGNs.length > 0 && parsedPGNs[currentPuzzleIndex]?.headers 
    ? parsedPGNs[currentPuzzleIndex].headers.find(h => h.name === 'FEN')?.value || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const getExpectedMove = (index: number): string | null => {
    if (parsedPGNs.length === 0 || currentPuzzleIndex >= parsedPGNs.length) return null;

    const game = parsedPGNs[currentPuzzleIndex];
    if (index < 0 || index >= game.moves.length) return null;

    return game.moves[index].move;
  }

  const handlePrevious = () => {
    if (currentPuzzleIndex > 0) {
      setCurrentPuzzleIndex(currentPuzzleIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentPuzzleIndex < parsedPGNs.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
    }
  };

  return (
    <div className="p-1 flex align-items-center justify-content-center">
      {!selectedPGN && <Card title="Tactics Practice">
        <div className="mb-4">
          <label htmlFor="pgn-select" className="block mb-2 font-semibold">
            Select Tactics PGN:
          </label>
          <Dropdown
            id="pgn-select"
            value={selectedPGN}
            options={pgnOptions}
            onChange={(e) => {
              const newPGN = e.value;
              setSelectedPGN(newPGN);
              if (newPGN) {
                localStorage.setItem(SELECTED_TACTICS_PGN_KEY, newPGN.filename);
              } else {
                localStorage.removeItem(SELECTED_TACTICS_PGN_KEY);
              }
            }}
            placeholder="Choose a tactics file..."
            className="w-full"
            disabled={uploadedPGNs.length === 0}
          />
          {uploadedPGNs.length === 0 && (
            <Message 
              severity="info" 
              text="No tactics PGNs found. Upload a tactics PGN file from the Database page." 
              className="mt-2"
            />
          )}
        </div>

        {error && (
          <Message severity="error" text={error} className="mb-4" />
        )}

        {selectedPGN && parsedPGNs.length === 0 && !error && (
          <Message 
            severity="warn" 
            text="No valid puzzles found in the selected PGN file." 
            className="mt-4"
          />
        )}
      </Card>}

      {selectedPGN && parsedPGNs.length > 0 && (
          <div>
            <ChessBoard
              name="tactics-practice"
              game_url={selectedPGN.id}
              fen={currentFEN}
              draggable={true}
              chessboardRef={chessboardRef}
              gameRef={gameRef}
              madeMoveRef={{ current: false }}
              moveCallback={(move) => {
                console.log('Move made:', move);

                if (move.san === getExpectedMove(0)) {
                  console.log('Correct move!');
                  return true;
                } else {
                  console.log('Incorrect move.');
                  return false;
                }
              }}
              size={`${boardSize}px`}
            />

            <div className="flex justify-content-center gap-2 mt-3">
              <Button
                label="Previous"
                icon="pi pi-chevron-left"
                onClick={handlePrevious}
                disabled={currentPuzzleIndex === 0}
              />
              <span className="flex align-items-center px-3">
                Puzzle {currentPuzzleIndex + 1} of {parsedPGNs.length}
              </span>
              <Button
                label="Next"
                icon="pi pi-chevron-right"
                iconPos="right"
                onClick={handleNext}
                disabled={currentPuzzleIndex >= parsedPGNs.length - 1}
              />
            </div>

          </div>
        )}
    </div>
  );
};