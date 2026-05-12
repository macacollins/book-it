import React, { useState, useEffect, useRef } from "react";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Button } from "primereact/button";
import { UploadedPGNClient } from "../database/UploadedPGNClient";
import { UploadedPGN } from "../database/types";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { gradualRepertoireToSavedPGN } from "../pgn/gradualRepertoireToSavedPGN";
import pgnParser, { ParsedPGN } from "pgn-parser";
import ChessBoard from "./ChessBoard";
import useWindowSize from "../hooks/useWindowSize";
import {
  saveDrillCompletion,
  getLastDrillCompletion,
  getAllDrillHistories,
} from "../services/drillProgress";
import { DrillCompletionData } from "../types/DrillProgress";
import "bootstrap-icons/font/bootstrap-icons.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputSwitch } from "primereact/inputswitch";
const SELECTED_REPERTOIRE_PGN_KEY = "SELECTED_REPERTOIRE_PGN";
const MOVE_DEPTH_KEY = "REPERTOIRE_DRILL_MOVE_DEPTH";
const DRILL_COLOR_KEY = "REPERTOIRE_DRILL_COLOR";
const DRILL_STARTED_KEY = "REPERTOIRE_DRILL_STARTED";
const CURRENT_EXERCISE_INDEX_KEY = "REPERTOIRE_CURRENT_EXERCISE_INDEX";
const LIMIT_MOVE_DEPTH_KEY = "REPERTOIRE_DRILL_LIMIT_MOVE_DEPTH";

export const RepertoireDrill = () => {
  const [uploadedPGNs, setUploadedPGNs] = useState<UploadedPGN[]>([]);
  const [selectedPGN, setSelectedPGN] = useState<UploadedPGN | null>(null);
  const [gradualRepertoireColors, setGradualRepertoireColors] = useState<
    Map<string, "white" | "black">
  >(new Map());
  const [parsedPGNs, setParsedPGNs] = useState<ParsedPGN[]>([]);
  const [exercises, setExercises] = useState<string[][]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const currentExerciseIndexRef = useRef<number>(0);
  const currentMoveIndexRef = useRef<number>(0);

  const [startingMove, setStartingMove] = useState<number>(18);
  const [endingMove, setEndingMove] = useState<number>(20);
  const [limitMoveDepth, setLimitMoveDepth] = useState<boolean>(true);
  const [drillColor, setDrillColor] = useState<"white" | "black">("white");

  const [drillStarted, setDrillStarted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [recentCompletions, setRecentCompletions] = useState<
    DrillCompletionData[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<any>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [width, height] = useWindowSize();
  const isWideLayout = width >= height + 250;
  const boardSize = isWideLayout ? height - 20 : Math.min(width, height) - 20;

  // Sync state to refs for chessboard lifecycle
  useEffect(() => {
    currentExerciseIndexRef.current = currentExerciseIndex;
  }, [currentExerciseIndex]);

  useEffect(() => {
    currentMoveIndexRef.current = currentMoveIndex;
  }, [currentMoveIndex]);

  // Persist currentExerciseIndex to database when it changes
  useEffect(() => {
    if (isInitialized) {
      console.log("Was initialized setting to ", currentExerciseIndex);
      localStorage.setItem(
        CURRENT_EXERCISE_INDEX_KEY,
        currentExerciseIndex.toString(),
      );
    } else {
      console.log("Not initialized, skipping setting current exercise index");
    }
  }, [currentExerciseIndex]);

  // Persist drillStarted to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      console.log("Was initialized setting drill started to ", drillStarted);
      localStorage.setItem(DRILL_STARTED_KEY, drillStarted.toString());
    } else {
      console.log("Not initialized, skipping setting drill started");
    }
  }, [drillStarted]);

  // Load all repertoire PGNs from database and restore state
  useEffect(() => {
    const loadRepertoirePGNs = async () => {
      try {
        setLoading(true);

        // Load drill started state from localStorage
        const savedDrillStarted = localStorage.getItem(DRILL_STARTED_KEY);
        if (savedDrillStarted === "true") {
          setDrillStarted(true);
        }

        // Load current exercise index from database
        const savedExerciseIndex = localStorage.getItem(
          CURRENT_EXERCISE_INDEX_KEY,
        );
        if (
          savedExerciseIndex !== null &&
          !isNaN(parseInt(savedExerciseIndex, 10))
        ) {
          setCurrentExerciseIndex(parseInt(savedExerciseIndex, 10));
          currentExerciseIndexRef.current = parseInt(savedExerciseIndex, 10);
          console.log(
            "Set currentExerciseIndex to",
            parseInt(savedExerciseIndex, 10),
          );
        } else {
          console.log("Did not load current exercise index from localStorage");
        }

        const repertoirePGNs = await UploadedPGNClient.getByType("repertoire");
        const gradualRepertoires = await GradualRepertoireClient.getAll();
        const gradualPGNs = gradualRepertoires.map(gradualRepertoireToSavedPGN);
        const colorMap = new Map<string, "white" | "black">();
        gradualRepertoires.forEach((gr, i) => {
          colorMap.set(gradualPGNs[i].filename, gr.color);
        });
        setGradualRepertoireColors(colorMap);
        setUploadedPGNs([...repertoirePGNs, ...gradualPGNs]);

        // Restore previously selected PGN if available
        const allPGNs = [...repertoirePGNs, ...gradualPGNs];
        const savedFilename = localStorage.getItem(SELECTED_REPERTOIRE_PGN_KEY);
        if (savedFilename && allPGNs.length > 0) {
          const matchingPGN = allPGNs.find(
            (pgn) => pgn.filename === savedFilename,
          );
          if (matchingPGN) {
            setSelectedPGN(matchingPGN);

            // Fall back to general saved settings if no completion history exists
            const savedMoveDepth = localStorage.getItem(MOVE_DEPTH_KEY);
            if (savedMoveDepth) {
              const moveDepth = parseInt(savedMoveDepth, 10);
              setEndingMove(moveDepth * 2);
              setStartingMove(moveDepth * 2 - 2);
            }

            const savedDrillColor = localStorage.getItem(DRILL_COLOR_KEY);
            if (savedDrillColor === "white" || savedDrillColor === "black") {
              setDrillColor(savedDrillColor);
            }
          }
        } else {
          // No PGN selected, restore general drill settings
          const savedMoveDepth = localStorage.getItem(MOVE_DEPTH_KEY);
          if (savedMoveDepth) {
            const moveDepth = parseInt(savedMoveDepth, 10);
            setEndingMove(moveDepth * 2);
            setStartingMove(moveDepth * 2 - 2);
          }

          const savedDrillColor = localStorage.getItem(DRILL_COLOR_KEY);
          if (savedDrillColor === "white" || savedDrillColor === "black") {
            setDrillColor(savedDrillColor);
          }
        }

        const savedLimitMoveDepth = localStorage.getItem(LIMIT_MOVE_DEPTH_KEY);
        if (savedLimitMoveDepth === "false") {
          setLimitMoveDepth(false);
        }

        // Load recent completions
        const histories = getAllDrillHistories();
        const allCompletions: DrillCompletionData[] = [];
        histories.forEach((history) => {
          allCompletions.push(...history.completions);
        });
        // Sort by completion date, most recent first
        allCompletions.sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime(),
        );

        // Deduplicate by filename, keeping only the most recent for each
        const seenFilenames = new Set<string>();
        const uniqueCompletions = allCompletions.filter((completion) => {
          if (seenFilenames.has(completion.filename)) {
            return false;
          }
          seenFilenames.add(completion.filename);
          return true;
        });

        // Take top 5 unique repertoires
        setRecentCompletions(uniqueCompletions.slice(0, 5));
      } catch (err) {
        console.error("Error loading repertoire PGNs:", err);
        setError("Failed to load repertoire from database");
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    loadRepertoirePGNs();
  }, []);

  // Parse PGN and create exercises when drill starts
  useEffect(() => {
    console.log(
      "Drill started changed to",
      selectedPGN?.filename,
      "isInitialized:",
      drillStarted,
    );
    if (selectedPGN && drillStarted) {
      try {
        const parsed = pgnParser.parse(selectedPGN.content);
        console.log("Got parsed", parsed);
        setParsedPGNs(parsed);

        // Create exercises from parsed PGNs
        type ExtractedLine = { path: string[]; isTerminal: boolean };
        const exerciseSet = new Set<string>();
        const exerciseList: ExtractedLine[] = [];

        // Helper function to extract moves and expand RAVs recursively.
        // isTerminal is true when a path ends at a leaf node (no further main-line moves).
        const extractMoveLists = (
          moves: any[],
          parentMoves: string[] = [],
        ): ExtractedLine[] => {
          const result: ExtractedLine[] = [];

          for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            if (move.move) {
              const currentPath = [...parentMoves, move.move];
              const isLastMove = i === moves.length - 1;

              // Emit this path; it's terminal when there are no further main-line moves
              if (currentPath.length > 0) {
                result.push({
                  path: currentPath.slice(0, 50),
                  isTerminal: isLastMove,
                });
              }

              // Recursively expand RAVs (alternative variations)
              if (move.ravs && move.ravs.length > 0) {
                move.ravs.forEach((rav: any) => {
                  if (rav.moves && rav.moves.length > 0) {
                    // For each RAV, start from the parent position and add the variation
                    const ravVariations = extractMoveLists(
                      rav.moves,
                      parentMoves,
                    );
                    result.push(...ravVariations);
                  }
                });
              }

              // Continue with the main line
              if (i < moves.length - 1) {
                const continuations = extractMoveLists(
                  moves.slice(i + 1),
                  currentPath,
                );
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

            variations.forEach(({ path, isTerminal }) => {
              // Create unique key for deduplication
              const key = path.join("|");

              if (!exerciseSet.has(key)) {
                exerciseSet.add(key);
                exerciseList.push({ path, isTerminal });
              }
            });
          }
        });

        let newExercises: string[][];
        if (!limitMoveDepth) {
          // Unlimited mode: only drill complete (terminal) lines
          newExercises = exerciseList
            .filter(({ isTerminal }) => isTerminal)
            .map(({ path }) => path);
        } else {
          // Limited mode: depth window, but also include short terminal lines
          const correctParity = (len: number) =>
            len % 2 === (drillColor === "white" ? 1 : 0);
          newExercises = exerciseList
            .filter(({ path, isTerminal }) => {
              if (!correctParity(path.length) || path.length === 0) return false;
              // Complete lines shorter than the window are always included
              if (isTerminal && path.length <= startingMove) return true;
              // Normal depth-window filter
              return path.length > startingMove && path.length <= endingMove;
            })
            .map(({ path }) => path);
        }
        console.log("Setting exercises to ", newExercises);
        setExercises(newExercises);

        if (drillColor === "white") {
          // setCurrentExerciseIndex(0);
          setCurrentMoveIndex(0);
          setError(null);
        } else {
          // setCurrentExerciseIndex(0);

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
        console.error("Error parsing PGN:", err);
        setError("Failed to parse selected PGN file");
        setParsedPGNs([]);
        setExercises([]);
      }
    } else {
      console.log("Clearing exercises");
      // setParsedPGNs([]);
      // setExercises([]);
      // setCurrentExerciseIndex(0);
      // setCurrentMoveIndex(0);
    }
  }, [selectedPGN, drillStarted, limitMoveDepth, startingMove, endingMove, drillColor]);

  // When a GradualRepertoire is selected, auto-set its color
  useEffect(() => {
    if (selectedPGN) {
      const gradualColor = gradualRepertoireColors.get(selectedPGN.filename);
      if (gradualColor) {
        setDrillColor(gradualColor);
        localStorage.setItem(DRILL_COLOR_KEY, gradualColor);
      }
    }
  }, [selectedPGN, gradualRepertoireColors]);

  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  const pgnOptions = uploadedPGNs
    .map((pgn) => ({
      label: pgn.filename,
      value: pgn,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const currentFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentMoveIndex(0);
      chessboardRef.current?.position(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
    }
  };

  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentMoveIndex(0);

      chessboardRef.current?.position(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
    }
  };

  const moveHandler = (move: { san: string }) => {
    console.log("Move made:", move);

    if (
      exercises.length === 0 ||
      currentExerciseIndexRef.current >= exercises.length
    ) {
      return false;
    }

    const currentExercise = exercises[currentExerciseIndexRef.current];

    // Only check white's moves (even indices: 0, 2, 4...)
    if (currentMoveIndexRef.current % 2 === (drillColor === "white" ? 1 : 0)) {
      // This is black's move, automatically play it
      return true;
    }

    const expectedMove = currentExercise[currentMoveIndexRef.current];

    console.log(
      "Was expecting",
      expectedMove,
      "got",
      move.san,
      "at move index",
      currentMoveIndexRef.current,
    );

    if (move.san === expectedMove) {
      // Correct move!
      const totalMoves = currentExercise.length;

      // Check if this was the last move
      if (currentMoveIndexRef.current >= totalMoves - 1) {
        setFeedback({ type: "success", message: "Exercise completed!" });
        setCurrentMoveIndex(0);

        // Auto-advance to next exercise
        if (currentExerciseIndexRef.current < exercises.length - 1) {
          setTimeout(() => {
            setCurrentExerciseIndex(currentExerciseIndexRef.current + 1);
            chessboardRef.current?.position(
              "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            );
            gameRef.current?.reset();

            if (drillColor === "black") {
              setTimeout(() => {
                const opponentMove =
                  exercises[currentExerciseIndexRef.current][0];
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
        } else {
          // Last exercise completed
          setFeedback({
            type: "info",
            message: "You have completed all exercises in this repertoire!",
          });

          // Save completion stats using the drillProgress service
          if (selectedPGN?.filename) {
            const completionData: DrillCompletionData = {
              filename: selectedPGN.filename,
              startingMove: startingMove,
              endingMove: endingMove,
              drillColor: drillColor,
              completedAt: new Date().toISOString(),
              exerciseCount: exercises.length,
            };
            saveDrillCompletion(completionData);
          }
        }
      } else {
        // More moves to go - increment and make opponent's move if it's black's turn
        const newMoveIndex = currentMoveIndexRef.current + 1;
        setCurrentMoveIndex(newMoveIndex);

        // If next move is black's move, play it automatically after a delay
        if (
          newMoveIndex < totalMoves &&
          newMoveIndex % 2 === (drillColor === "white" ? 1 : 0)
        ) {
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
      setFeedback({
        type: "error",
        message: "That's not the right move. Try again!",
      });
      return false;
    }
  };

  const handleStartDrill = () => {
    if (selectedPGN) {
      setDrillStarted(true);
      setCurrentExerciseIndex(0);
    }
  };

  const handleStartNextRange = () => {
    if (selectedPGN) {
      const currentMoveDepth = endingMove / 2;
      const newMoveDepth = Math.min(currentMoveDepth + 1, 20); // Cap at depth 20

      const newEndingMove = newMoveDepth * 2;
      const newStartingMove = newEndingMove - 2;

      setStartingMove(newStartingMove);
      setEndingMove(newEndingMove);
      localStorage.setItem(MOVE_DEPTH_KEY, newMoveDepth.toString());

      console.log("Setting new move depth to", newMoveDepth);

      setDrillStarted(true);
      setCurrentExerciseIndex(0);
    }
  };

  const handleStartFromCompletion = (completion: DrillCompletionData) => {
    // Find the matching PGN
    const matchingPGN = uploadedPGNs.find(
      (pgn) => pgn.filename === completion.filename,
    );
    if (matchingPGN) {
      setSelectedPGN(matchingPGN);
      setStartingMove(completion.startingMove);
      setEndingMove(completion.endingMove);
      setDrillColor(completion.drillColor);
      localStorage.setItem(SELECTED_REPERTOIRE_PGN_KEY, matchingPGN.filename);
      localStorage.setItem(
        MOVE_DEPTH_KEY,
        (completion.endingMove / 2).toString(),
      );
      localStorage.setItem(DRILL_COLOR_KEY, completion.drillColor);
      setDrillStarted(true);
      setCurrentExerciseIndex(0);
    }
  };

  const handleStartNextFromCompletion = (completion: DrillCompletionData) => {
    // Find the matching PGN
    const matchingPGN = uploadedPGNs.find(
      (pgn) => pgn.filename === completion.filename,
    );
    if (matchingPGN) {
      const currentMoveDepth = completion.endingMove / 2;
      const newMoveDepth = Math.min(currentMoveDepth + 1, 20); // Cap at depth 20

      const newEndingMove = newMoveDepth * 2;
      const newStartingMove = newEndingMove - 2;

      setSelectedPGN(matchingPGN);
      setStartingMove(newStartingMove);
      setEndingMove(newEndingMove);
      setDrillColor(completion.drillColor);
      localStorage.setItem(SELECTED_REPERTOIRE_PGN_KEY, matchingPGN.filename);
      localStorage.setItem(MOVE_DEPTH_KEY, newMoveDepth.toString());
      localStorage.setItem(DRILL_COLOR_KEY, completion.drillColor);
      setDrillStarted(true);
      setCurrentExerciseIndex(0);
    }
  };

  const FeedbackDisplay = () => {
    if (!feedback.type) return <div style={{ height: "24px" }} />;

    const iconClass =
      feedback.type === "success"
        ? "bi bi-check-circle-fill"
        : feedback.type === "error"
          ? "bi bi-x-circle-fill"
          : "bi bi-info-circle-fill";

    const colorClass =
      feedback.type === "success"
        ? "text-green-500"
        : feedback.type === "error"
          ? "text-red-500"
          : "text-blue-500";

    return (
      <div
        className={`flex align-items-center gap-2 ${colorClass}`}
        style={{ height: "24px" }}
      >
        <i className={iconClass}></i>
        <span>{feedback.message}</span>
      </div>
    );
  };

  const ControlsPanel = () => (
    <>
      <div className="flex justify-content-center gap-2">
        <Button
          label={isWideLayout ? "Previous" : undefined}
          aria-label="Previous"
          icon="bi bi-chevron-left"
          onClick={handlePrevious}
          disabled={currentExerciseIndex === 0}
        />
        <span className="flex align-items-center px-3">
          Exercise {currentExerciseIndex + 1} of {exercises.length}
        </span>
        <Button
          label={isWideLayout ? "Next" : undefined}
          aria-label="Next"
          icon="bi bi-chevron-right"
          iconPos="right"
          onClick={handleNext}
          disabled={currentExerciseIndex >= exercises.length - 1}
        />
      </div>

      <FeedbackDisplay />

      <div className="text-center mt-2">
        <div>
          Drilling as:{" "}
          <strong>{drillColor === "white" ? "White" : "Black"}</strong>
        </div>
        {limitMoveDepth && (
          <div>
            Move depth: <strong>{endingMove / 2}</strong>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="p-1 flex flex-wrap align-items-center justify-content-center">
      {!drillStarted && recentCompletions.length > 0 && (
        <Card title="Recent Drills" className="m-3">
          <DataTable value={recentCompletions} size="small" stripedRows>
            <Column
              field="filename"
              header="Repertoire"
              style={{ width: "30%" }}
            />
            <Column
              header="Move Depth"
              body={(rowData: DrillCompletionData) => rowData.endingMove / 2}
              style={{ width: "15%" }}
            />
            <Column
              field="drillColor"
              header="Color"
              body={(rowData: DrillCompletionData) => (
                <span className="capitalize">{rowData.drillColor}</span>
              )}
              style={{ width: "12%" }}
            />
            <Column
              header="Actions"
              body={(rowData: DrillCompletionData) => (
                <div className="flex gap-1">
                  <Button
                    label="Start"
                    icon="bi bi-play-fill"
                    onClick={() => handleStartFromCompletion(rowData)}
                    size="small"
                    className="p-button-success p-button-sm"
                  />
                  <Button
                    label="Start Next"
                    icon="bi bi-fast-forward-fill"
                    onClick={() => handleStartNextFromCompletion(rowData)}
                    size="small"
                    disabled={rowData.endingMove / 2 >= 20}
                    className="p-button-info p-button-sm"
                  />
                </div>
              )}
              style={{ width: "40%" }}
            />
          </DataTable>
        </Card>
      )}

      {!drillStarted && (
        <Card title="Repertoire Drill">
          <div className="mb-4">
            <label htmlFor="pgn-select" className="block mb-2 font-semibold">
              Select Repertoire PGN:
            </label>
            <Dropdown
              id="pgn-select"
              value={selectedPGN}
              options={pgnOptions}
              filter
              filterMatchMode="contains"
              filterPlaceholder="Search repertoires..."
              onChange={(e) => {
                const newPGN = e.value;
                setSelectedPGN(newPGN);
                if (newPGN) {
                  localStorage.setItem(
                    SELECTED_REPERTOIRE_PGN_KEY,
                    newPGN.filename,
                  );

                  // Load drill settings for this PGN
                  const lastCompletion = getLastDrillCompletion(
                    newPGN.filename,
                  );
                  if (lastCompletion) {
                    setStartingMove(lastCompletion.startingMove);
                    setEndingMove(lastCompletion.endingMove);
                    setDrillColor(lastCompletion.drillColor);
                  }
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
            <div className="col-12 md:col-6">
              <label htmlFor="drill-color" className="block mb-2 font-semibold">
                Drill as Color:
              </label>
              <Dropdown
                id="drill-color"
                value={drillColor}
                options={[
                  { label: "White", value: "white" },
                  { label: "Black", value: "black" },
                ]}
                onChange={(e) => {
                  setDrillColor(e.value);
                  localStorage.setItem(DRILL_COLOR_KEY, e.value);
                }}
                className="w-full"
                disabled={!!(
                  selectedPGN &&
                  gradualRepertoireColors.has(selectedPGN.filename)
                )}
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block mb-2 font-semibold">Limit Move Depth:</label>
              <div className="flex align-items-center gap-2">
                <InputSwitch
                  checked={limitMoveDepth}
                  onChange={(e) => {
                    const val = e.value;
                    setLimitMoveDepth(val);
                    localStorage.setItem(LIMIT_MOVE_DEPTH_KEY, val.toString());
                  }}
                />
                <span>{limitMoveDepth ? "On" : "Off (full lines)"}</span>
              </div>
            </div>

            {limitMoveDepth && (
              <div className="col-12 md:col-6">
                <label htmlFor="move-depth" className="block mb-2 font-semibold">
                  Move Depth:
                </label>
                <Dropdown
                  id="move-depth"
                  value={endingMove / 2}
                  options={Array.from({ length: 20 }, (_, i) => ({
                    label: `${i + 1}`,
                    value: i + 1,
                  }))}
                  onChange={(e) => {
                    const moveDepth = e.value;
                    const newEndingMove = moveDepth * 2;
                    const newStartingMove = newEndingMove - 2;
                    setEndingMove(newEndingMove);
                    setStartingMove(newStartingMove);
                    localStorage.setItem(MOVE_DEPTH_KEY, moveDepth.toString());
                  }}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {error && <Message severity="error" text={error} className="mb-4" />}

          <div className="flex justify-content-center gap-2 mt-4">
            <Button
              label="Start Drill"
              icon="bi bi-play-fill"
              onClick={handleStartDrill}
              disabled={!selectedPGN}
              size="large"
              className="p-button-success"
            />
            <Button
              label="Start Next"
              icon="bi bi-fast-forward-fill"
              onClick={handleStartNextRange}
              disabled={!selectedPGN || endingMove / 2 >= 20}
              size="large"
              className="p-button-info"
            />
          </div>
        </Card>
      )}

      {drillStarted && selectedPGN && exercises.length === 0 && (
        <Card title="No Exercises Found">
          <Message
            severity="warn"
            text={`No exercises found for the selected criteria (moves ${startingMove}-${endingMove}, drilling as ${drillColor}). Try adjusting your settings.`}
            className="mb-4"
          />
          <div className="flex justify-content-center">
            <Button
              label="Back to Settings"
              icon="bi bi-arrow-left"
              onClick={async () => {
                setDrillStarted(false);
                setCurrentExerciseIndex(0);
                localStorage.setItem(CURRENT_EXERCISE_INDEX_KEY, "0");
              }}
              className="p-button-secondary"
            />
          </div>
        </Card>
      )}

      {drillStarted &&
        selectedPGN &&
        exercises.length > 0 &&
        (isWideLayout ? (
          <div className="flex align-items-center gap-4">
            <div>
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
                invert={drillColor === "black"}
              />
            </div>
            <div className="flex flex-column gap-2">
              <div className="flex justify-content-between align-items-center mb-3">
                <h3 className="m-0">{selectedPGN.filename}</h3>
              </div>

              <ControlsPanel />

              <Button
                label="Choose Another"
                icon="bi bi-book"
                onClick={async () => {
                  setDrillStarted(false);
                  setSelectedPGN(null);
                  setExercises([]);
                  setCurrentExerciseIndex(0);
                  setCurrentMoveIndex(0);
                  localStorage.removeItem(SELECTED_REPERTOIRE_PGN_KEY);
                  localStorage.setItem(CURRENT_EXERCISE_INDEX_KEY, "0");
                }}
                className="p-button-secondary p-button-sm mt-3"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-column gap-1">
            <div className="flex justify-content-between align-items-center mb-3">
              <h3 className="m-0">{selectedPGN.filename}</h3>
              <Button
                label="Choose Another"
                icon="bi bi-book"
                onClick={async () => {
                  setDrillStarted(false);
                  setSelectedPGN(null);
                  setExercises([]);
                  setCurrentExerciseIndex(0);
                  setCurrentMoveIndex(0);
                  localStorage.removeItem(SELECTED_REPERTOIRE_PGN_KEY);
                  localStorage.setItem(CURRENT_EXERCISE_INDEX_KEY, "0");
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
              invert={drillColor === "black"}
            />

            <ControlsPanel />
          </div>
        ))}
    </div>
  );
};
