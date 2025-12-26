import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { Checkbox } from 'primereact/checkbox';
import { UploadedPGNClient } from '../database/UploadedPGNClient';
import { TacticsProgressClient } from '../database/TacticsProgressClient';
import { UploadedPGN, TacticsProgress } from '../database/types';
import pgnParser, { ParsedPGN } from 'pgn-parser';
import ChessBoard from './ChessBoard';
import useWindowSize from '../hooks/useWindowSize';
import { Button } from 'primereact/button';

const SELECTED_TACTICS_PGN_KEY = 'SELECTED_TACTICS_PGN';
const AUTO_NEXT_KEY = 'TACTICS_AUTO_NEXT';

export const TacticsPractice = () => {
  const [uploadedPGNs, setUploadedPGNs] = useState<UploadedPGN[]>([]);
  const [selectedPGN, setSelectedPGN] = useState<UploadedPGN | null>(null);
  const [parsedPGNs, setParsedPGNs] = useState<ParsedPGN[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(500);
  const [tacticsProgress, setTacticsProgress] = useState<TacticsProgress | null>(null);
  const puzzleMoveIndexRef = useRef<number>(0);
  
  // Initialize autoNext from localStorage
  const getInitialAutoNext = () => {
    const saved = localStorage.getItem(AUTO_NEXT_KEY);
    return saved ? JSON.parse(saved) : false;
  };
  const autoNextRef = useRef<boolean>(getInitialAutoNext());
  const [autoNextDisplay, setAutoNextDisplay] = useState(autoNextRef.current);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<any>(null);
  const toast = useRef<Toast>(null);
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

  // Parse PGN when selection changes and load/create progress
  useEffect(() => {
    const loadPGNAndProgress = async () => {
      if (selectedPGN) {
        try {
          const parsed = pgnParser.parse(selectedPGN.content);
          setParsedPGNs(parsed);
          setCurrentPuzzleIndex(500);
          puzzleMoveIndexRef.current = 0;
          setError(null);

          // Load or create progress record
          let progress = await TacticsProgressClient.getById(selectedPGN.id);
          if (!progress) {
            // Create new progress record
            progress = {
              id: selectedPGN.id,
              tacticsSolved: [],
              totalTactics: parsed.length,
              lastSolvedTimestamp: Date.now()
            };
            await TacticsProgressClient.insert(progress);
          }
          setTacticsProgress(progress);
          
          // Set current puzzle index to one more than the highest solved index
          if (progress.tacticsSolved.length > 0) {
            const highestSolved = Math.max(...progress.tacticsSolved);
            setCurrentPuzzleIndex(highestSolved + 1);
          } else {
            setCurrentPuzzleIndex(0);
          }
        } catch (err) {
          console.error('Error parsing PGN:', err);
          setError('Failed to parse selected PGN file');
          setParsedPGNs([]);
          setTacticsProgress(null);
        }
      } else {
        setParsedPGNs([]);
        setCurrentPuzzleIndex(0);
        puzzleMoveIndexRef.current = 0;
        setTacticsProgress(null);
      }
    };

    loadPGNAndProgress();
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
    if (index < 0 || index >= game.moves.length) {
      return null;
    }

    return game.moves[index].move;
  }

  const handlePrevious = () => {
    if (currentPuzzleIndex > 0) {
      setCurrentPuzzleIndex(currentPuzzleIndex - 1);
      puzzleMoveIndexRef.current = 0;
    }
  };

  const handleNext = () => {
    if (currentPuzzleIndex < parsedPGNs.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1);
      puzzleMoveIndexRef.current = 0;
    }
  };

  const getCurrentMoveIndex = () => {
    return puzzleMoveIndexRef.current;
  }

  const moveHandler = (move: {san: string}) => {
      console.log('Move made:', move);

      console.log("Current move index ref:", puzzleMoveIndexRef.current);
      console.log("Current move index function:", getCurrentMoveIndex());

      const expectedMove = getExpectedMove(puzzleMoveIndexRef.current);
      
      console.log("Was expecting", expectedMove, "got", move.san);
        const currentPuzzle = parsedPGNs[currentPuzzleIndex];
        const totalMoves = currentPuzzle.moves.length;
        console.log("Puzzle move index:", puzzleMoveIndexRef.current, "Total moves:", totalMoves);
      if (move.san === expectedMove) {
        // Correct move!

        // Check if this was the last move
        if (puzzleMoveIndexRef.current >= totalMoves - 1) {
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'You did it!',
            life: 1000
          });
          puzzleMoveIndexRef.current = 0;
          console.log("Puzzle completed. Resetting move index to 0.");
          
          // Update tactics progress
          if (selectedPGN) {
            TacticsProgressClient.updateTacticsSolved(selectedPGN.id, [currentPuzzleIndex])
              .then(async () => {
                // Refresh progress state
                const updatedProgress = await TacticsProgressClient.getById(selectedPGN.id);
                if (updatedProgress) {
                  setTacticsProgress(updatedProgress);
                }
                console.log(`Progress updated: puzzle ${currentPuzzleIndex} marked as solved`);
              })
              .catch(err => {
                console.error('Error updating tactics progress:', err);
              });
          }
          
          // Auto-advance to next puzzle if enabled
          if (autoNextRef.current && currentPuzzleIndex < parsedPGNs.length - 1) {
            setTimeout(() => {
              setCurrentPuzzleIndex(currentPuzzleIndex + 1);
            }, 1000);
          }
        } else {
          // More moves to go - increment and make opponent's move
          const newMoveIndex = puzzleMoveIndexRef.current + 1;
          puzzleMoveIndexRef.current = newMoveIndex;
          console.log("Incremented move index to " + newMoveIndex);
          
          // Wait 1 second, then make opponent's move
          setTimeout(() => {
            const opponentMove = getExpectedMove(newMoveIndex);
            if (opponentMove && gameRef.current && chessboardRef.current) {
              const moveResult = gameRef.current.move(opponentMove);
              if (moveResult) {
                chessboardRef.current.position(gameRef.current.fen());
                puzzleMoveIndexRef.current = newMoveIndex + 1;
                console.log("Setting move index to "  + (newMoveIndex + 1));
              }
            }
          }, 300);
        }
        
        return true;
      } else {
        // Incorrect move
        toast.current?.show({
          severity: 'error',
          summary: 'Incorrect',
          detail: "That's not it.",
          life: 3000
        });
        return false;
      }
    }

  return (
    <div className="p-1 flex align-items-center justify-content-center">
      <Toast ref={toast} />
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
              moveCallback={moveHandler}
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
              <div className="flex align-items-center gap-2 ml-3">
                <Checkbox
                  inputId="auto-next"
                  checked={autoNextDisplay}
                  onChange={(e) => {
                    const newValue = e.checked || false;
                    autoNextRef.current = newValue;
                    setAutoNextDisplay(newValue);
                    localStorage.setItem(AUTO_NEXT_KEY, JSON.stringify(newValue));
                  }}
                />
                <label htmlFor="auto-next" className="cursor-pointer">
                  Auto Next
                </label>
              </div>
            </div>
            {/* {getExpectedMove(puzzleMoveIndexRef.current)}
            Puzzle Index: {currentPuzzleIndex}
            Puzzle move index: {puzzleMoveIndexRef.current} */}

          </div>
        )}
    </div>
  );
};