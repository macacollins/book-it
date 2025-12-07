import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { UploadedPGNClient } from '../database/UploadedPGNClient';
import { UploadedPGN } from '../database/types';
import pgnParser, { ParsedPGN } from 'pgn-parser';
import ChessBoard from './ChessBoard';
import useWindowSize from '../hooks/useWindowSize';

const SELECTED_REPERTOIRE_PGN_KEY = 'SELECTED_REPERTOIRE_PGN';
const STARTING_MOVE_KEY = 'REPERTOIRE_DRILL_STARTING_MOVE';
const ENDING_MOVE_KEY = 'REPERTOIRE_DRILL_ENDING_MOVE';
const DRILL_COLOR_KEY = 'REPERTOIRE_DRILL_COLOR';

export const RepertoireDrill = () => {
  const [uploadedPGNs, setUploadedPGNs] = useState<UploadedPGN[]>([]);
  const [selectedPGN, setSelectedPGN] = useState<UploadedPGN | null>(null);
  const [parsedPGNs, setParsedPGNs] = useState<ParsedPGN[]>([]);
  const [exercises, setExercises] = useState<string[][]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const currentExerciseIndexRef = useRef<number>(0);
  const currentMoveIndexRef = useRef<number>(0);
  
  const [startingMove, setStartingMove] = useState<number>(1);
  const [endingMove, setEndingMove] = useState<number>(20);
  const [drillColor, setDrillColor] = useState<'white' | 'black'>('white');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<any>(null);
  const toast = useRef<Toast>(null);
  const [width, height] = useWindowSize();
  const boardSize = Math.min(width, height) - 20;

  // Sync state to refs for chessboard lifecycle
  useEffect(() => {
    currentExerciseIndexRef.current = currentExerciseIndex;
  }, [currentExerciseIndex]);

  useEffect(() => {
    currentMoveIndexRef.current = currentMoveIndex;
  }, [currentMoveIndex]);

  // Load all repertoire PGNs from database
  useEffect(() => {
    const loadRepertoirePGNs = async () => {
      try {
        setLoading(true);
        const repertoirePGNs = await UploadedPGNClient.getByType('repertoire');
        setUploadedPGNs(repertoirePGNs);
        
        // Restore previously selected PGN if available
        const savedFilename = localStorage.getItem(SELECTED_REPERTOIRE_PGN_KEY);
        if (savedFilename && repertoirePGNs.length > 0) {
          const matchingPGN = repertoirePGNs.find(pgn => pgn.filename === savedFilename);
          if (matchingPGN) {
            setSelectedPGN(matchingPGN);
          }
        }
      } catch (err) {
        console.error('Error loading repertoire PGNs:', err);
        setError('Failed to load repertoire from database');
      } finally {
        setLoading(false);
      }
    };

    loadRepertoirePGNs();
  }, []);

  // Parse PGN and create exercises when selection changes
  useEffect(() => {
    if (selectedPGN) {
      try {
        const parsed = pgnParser.parse(selectedPGN.content);
        console.log("Got parsed", parsed);
        setParsedPGNs(parsed);
        
        // Create exercises from parsed PGNs
        const exerciseSet = new Set<string>();
        const exerciseList: string[][] = [];
        
        // Helper function to extract moves and expand RAVs recursively
        const extractMoveLists = (moves: any[], parentMoves: string[] = []): string[][] => {
          const result: string[][] = [];
          
          for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            if (move.move) {
              const currentPath = [...parentMoves, move.move];
              
              // If we have at least some moves, add this variation
              if (currentPath.length > 0) {
                result.push(currentPath.slice(0, 50)); // Limit to 50 moves
              }
              
              // Recursively expand RAVs (alternative variations)
              if (move.ravs && move.ravs.length > 0) {
                move.ravs.forEach((rav: any) => {
                  if (rav.moves && rav.moves.length > 0) {
                    // For each RAV, start from the parent position and add the variation
                    const ravVariations = extractMoveLists(rav.moves, parentMoves);
                    result.push(...ravVariations);
                  }
                });
              }
              
              // Continue with the main line
              if (i < moves.length - 1) {
                const continuations = extractMoveLists(moves.slice(i + 1), currentPath);
                result.push(...continuations);
                break; // We've processed the rest recursively
              }
            }
          }
          
          return result;
        };
        
        parsed.forEach((pgn) => {
          if (pgn.moves && pgn.moves.length > 0) {
            const variations = extractMoveLists(pgn.moves);
            
            variations.forEach((movesArray) => {
              // Create unique key for deduplication
              const key = movesArray.join('|');
              
              if (!exerciseSet.has(key)) {
                exerciseSet.add(key);
                exerciseList.push(movesArray);
              }
            });
          }
        });


        const newExercises = exerciseList.filter(ex => ex.length > startingMove && ex.length <= endingMove&& ex.length % 2 === (drillColor === "white" ? 1 : 0));
        console.log("Setting exercises to ", newExercises);
        setExercises(newExercises);

        if (drillColor === 'white') {
          setCurrentExerciseIndex(0);
          setCurrentMoveIndex(0);
          setError(null);
        } else {
          setCurrentExerciseIndex(0);

          setTimeout(() => {
            const opponentMove = newExercises[0][0];
            if (opponentMove && gameRef.current && chessboardRef.current) {
              const moveResult = gameRef.current.move(opponentMove);
              if (moveResult) {
                chessboardRef.current.position(gameRef.current.fen());
                setCurrentMoveIndex(1);
              }
            }
          }, 300);
          
          setError(null);
        }

      } catch (err) {
        console.error('Error parsing PGN:', err);
        setError('Failed to parse selected PGN file');
        setParsedPGNs([]);
        setExercises([]);
      }
    } else {

      console.log("Clearing exercises");
      setParsedPGNs([]);
      setExercises([]);
      setCurrentExerciseIndex(0);
      setCurrentMoveIndex(0);
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

  const currentFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentMoveIndex(0);
            chessboardRef.current?.position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

    }
  };

  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentMoveIndex(0);

      chessboardRef.current?.position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }
  };

  const moveHandler = (move: {san: string}) => {
    console.log('Move made:', move);

    if (exercises.length === 0 || currentExerciseIndexRef.current >= exercises.length) {
      return false;
    }

    const currentExercise = exercises[currentExerciseIndexRef.current];
    
    // Only check white's moves (even indices: 0, 2, 4...)
    if (currentMoveIndexRef.current % 2 === (drillColor === "white" ? 1 : 0)) {
      // This is black's move, automatically play it
      return true;
    }

    const expectedMove = currentExercise[currentMoveIndexRef.current];
    
    console.log("Was expecting", expectedMove, "got", move.san, "at move index", currentMoveIndexRef.current);

    if (move.san === expectedMove) {
      // Correct move!
      const totalMoves = currentExercise.length;

      // Check if this was the last move
      if (currentMoveIndexRef.current >= totalMoves - 1) {
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Exercise completed!',
          life: 2000
        });
        setCurrentMoveIndex(0);

        // Auto-advance to next exercise
        if (currentExerciseIndexRef.current < exercises.length - 1) {
          setTimeout(() => {
            setCurrentExerciseIndex(currentExerciseIndexRef.current + 1);
            chessboardRef.current?.position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            gameRef.current?.reset();

            if (drillColor === 'black') {
              setTimeout(() => {
                const opponentMove = exercises[currentExerciseIndexRef.current][0];
                if (opponentMove && gameRef.current && chessboardRef.current) {
                  const moveResult = gameRef.current.move(opponentMove);
                  if (moveResult) {
                    chessboardRef.current.position(gameRef.current.fen());
                    setCurrentMoveIndex(1);
                  }
                }
              }, 300);
            }
          }, 2000);
        }
      } else {
        // More moves to go - increment and make opponent's move if it's black's turn
        const newMoveIndex = currentMoveIndexRef.current + 1;
        setCurrentMoveIndex(newMoveIndex);
        
        // If next move is black's move, play it automatically after a delay
        if (newMoveIndex < totalMoves && newMoveIndex % 2 === (drillColor === "white" ? 1 : 0)) {
          setTimeout(() => {
            const opponentMove = currentExercise[newMoveIndex];
            if (opponentMove && gameRef.current && chessboardRef.current) {
              const moveResult = gameRef.current.move(opponentMove);
              if (moveResult) {
                chessboardRef.current.position(gameRef.current.fen());
                setCurrentMoveIndex(newMoveIndex + 1);
              }
            }
          }, 300);
        }
      }
      
      return true;
    } else {
      // Incorrect move
      toast.current?.show({
        severity: 'error',
        summary: 'Incorrect',
        detail: "That's not the right move. Try again!",
        life: 3000
      });
      return false;
    }
  };

  return (
    <div className="p-1 flex align-items-center justify-content-center">
      <Toast ref={toast} />
      {!selectedPGN && (
        <Card title="Repertoire Drill">
          <div className="mb-4">
            <label htmlFor="pgn-select" className="block mb-2 font-semibold">
              Select Repertoire PGN:
            </label>
            <Dropdown
              id="pgn-select"
              value={selectedPGN}
              options={pgnOptions}
              onChange={(e) => {
                const newPGN = e.value;
                setSelectedPGN(newPGN);
                if (newPGN) {
                  localStorage.setItem(SELECTED_REPERTOIRE_PGN_KEY, newPGN.filename);
                } else {
                  localStorage.removeItem(SELECTED_REPERTOIRE_PGN_KEY);
                }
              }}
              placeholder="Choose a repertoire file..."
              className="w-full"
              disabled={uploadedPGNs.length === 0}
            />
            {uploadedPGNs.length === 0 && (
              <Message 
                severity="info" 
                text="No repertoire PGNs found. Upload a repertoire PGN file from the Database page." 
                className="mt-2"
              />
            )}
          </div>

          <div className="grid mb-4">
            <div className="col-12 md:col-4">
              <label htmlFor="drill-color" className="block mb-2 font-semibold">
                Drill as Color:
              </label>
              <Dropdown
                id="drill-color"
                value={drillColor}
                options={[
                  { label: 'White', value: 'white' },
                  { label: 'Black', value: 'black' }
                ]}
                onChange={(e) => {
                  setDrillColor(e.value);
                  localStorage.setItem(DRILL_COLOR_KEY, e.value);
                }}
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-4">
              <label htmlFor="starting-move" className="block mb-2 font-semibold">
                Starting Move Number:
              </label>
              <Dropdown
                id="starting-move"
                value={startingMove}
                options={Array.from({ length: 30 }, (_, i) => ({
                  label: `${i + 1}`,
                  value: i + 1
                }))}
                onChange={(e) => {
                  const newStart = e.value;
                  setStartingMove(newStart);
                  localStorage.setItem(STARTING_MOVE_KEY, newStart.toString());
                  // Ensure ending move is always >= starting move
                  if (endingMove < newStart) {
                    setEndingMove(newStart);
                    localStorage.setItem(ENDING_MOVE_KEY, newStart.toString());
                  }
                }}
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-4">
              <label htmlFor="ending-move" className="block mb-2 font-semibold">
                Ending Move Number:
              </label>
              <Dropdown
                id="ending-move"
                value={endingMove}
                options={Array.from({ length: 40 - startingMove + 1 }, (_, i) => ({
                  label: `${startingMove + i}`,
                  value: startingMove + i
                }))}
                onChange={(e) => {
                  setEndingMove(e.value);
                  localStorage.setItem(ENDING_MOVE_KEY, e.value.toString());
                }}
                className="w-full"
              />
            </div>
          </div>

          {error && (
            <Message severity="error" text={error} className="mb-4" />
          )}

          {selectedPGN && exercises.length === 0 && !error && (
            <Message 
              severity="warn" 
              text="No valid exercises found in the selected PGN file." 
              className="mt-4"
            />
          )}
        </Card>
      )}

      {selectedPGN && exercises.length > 0 && (
        <div>
          <div className="flex justify-content-between align-items-center mb-3">
            <h3 className="m-0">{selectedPGN.filename}</h3>
            <Button
              label="Choose Another"
              icon="pi pi-book"
              onClick={() => {
                setSelectedPGN(null);
                setExercises([]);
                setCurrentExerciseIndex(0);
                setCurrentMoveIndex(0);
                localStorage.removeItem(SELECTED_REPERTOIRE_PGN_KEY);
              }}
              className="p-button-secondary p-button-sm"
            />
          </div>

          <ChessBoard
            name="repertoire-drill"
            game_url={selectedPGN.id}
            fen={currentFEN}
            draggable={true}
            chessboardRef={chessboardRef}
            gameRef={gameRef}
            madeMoveRef={{ current: false }}
            moveCallback={moveHandler}
            size={`${boardSize}px`}
            invert={drillColor === 'black'}
          />

          <div className="flex justify-content-center gap-2 mt-3">
            <Button
              label="Previous"
              icon="pi pi-chevron-left"
              onClick={handlePrevious}
              disabled={currentExerciseIndex === 0}
            />
            <span className="flex align-items-center px-3">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </span>
            <Button
              label="Next"
              icon="pi pi-chevron-right"
              iconPos="right"
              onClick={handleNext}
              disabled={currentExerciseIndex >= exercises.length - 1}
            />
          </div>
          
          <div className="text-center mt-2">
            Move {Math.floor(currentMoveIndex / 2) + 1}
            Current move index {currentMoveIndex}
            Current Exercise index {currentExerciseIndex}
            Expecting move {exercises[currentExerciseIndex][currentMoveIndex]}
            Exercise count {exercises.length}


            <div>Drilling as: <strong>{drillColor === 'white' ? 'White' : 'Black'}</strong></div>
            <div>Move range: <strong>{startingMove} - {endingMove}</strong></div>
            <div>Current position: Move {Math.floor(((startingMove - 1) * 2 + currentMoveIndex) / 2) + 1}</div>
          </div>
            <pre>{JSON.stringify(exercises,null,2)}</pre>
        </div>
      )}
    </div>
  );
};