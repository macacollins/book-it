import React, { useState, useEffect, useRef } from "react";
import { GradualRepertoire, RepertoireColor } from "../database/types";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { Move } from "chess.js";
import ChessBoard from "./ChessBoard";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Checkbox } from "primereact/checkbox";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import useWindowSize from "../hooks/useWindowSize";

const DEFAULT_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const DEPTH_OPTIONS = Array.from({ length: 39 }, (_, i) => ({
  label: String(i + 2),
  value: i + 2,
}));

function isUserMoveAtIndex(
  index: number,
  startingFEN: string,
  color: RepertoireColor,
): boolean {
  const side = startingFEN.split(" ")[1]; // 'w' or 'b'
  const sideAtIndex = index % 2 === 0 ? side : side === "w" ? "b" : "w";
  return (
    (sideAtIndex === "w" && color === "white") ||
    (sideAtIndex === "b" && color === "black")
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const GradualPractice: React.FC = () => {
  // ── Loading / repertoire list ──────────────────────────────────────────────
  const [repertoires, setRepertoires] = useState<GradualRepertoire[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Setup form state ───────────────────────────────────────────────────────
  const [selectedRepertoire, setSelectedRepertoire] =
    useState<GradualRepertoire | null>(null);
  const [limitDepth, setLimitDepth] = useState(false);
  const [depthLimit, setDepthLimit] = useState(10);
  const [randomize, setRandomize] = useState(false);

  // ── Drill runtime state ────────────────────────────────────────────────────
  const [drillStarted, setDrillStarted] = useState(false);
  const [exercises, setExercises] = useState<string[][]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const currentExerciseIndexRef = useRef(0);
  const currentMoveIndexRef = useRef(0);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // ── Board refs ─────────────────────────────────────────────────────────────
  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<any>(null);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const [width, height] = useWindowSize();
  const isWideLayout = width >= height + 250;
  const boardSize = isWideLayout ? height - 20 : Math.min(width, height) - 20;

  // ── Load repertoires ───────────────────────────────────────────────────────
  useEffect(() => {
    GradualRepertoireClient.getAll().then((reps) => {
      setRepertoires(reps);
      setLoading(false);
    });
  }, []);

  // ── Keep index refs in sync ────────────────────────────────────────────────
  useEffect(() => {
    currentExerciseIndexRef.current = currentExerciseIndex;
  }, [currentExerciseIndex]);

  useEffect(() => {
    currentMoveIndexRef.current = currentMoveIndex;
  }, [currentMoveIndex]);

  // ── Derived values (safe in closures; don't change during a drill session) ─
  const startingFEN = selectedRepertoire?.startingFEN ?? DEFAULT_FEN;
  const color: RepertoireColor = selectedRepertoire?.color ?? "white";

  // ── startExercise: reset board and optionally auto-play opponent's 1st move ─
  const startExercise = (
    index: number,
    exList: string[][],
    fen: string,
    col: RepertoireColor,
  ) => {
    const exercise = exList[index];
    if (!exercise || exercise.length === 0) return;

    chessboardRef.current?.position(fen);
    setCurrentMoveIndex(0);
    currentMoveIndexRef.current = 0;

    if (!isUserMoveAtIndex(0, fen, col)) {
      setTimeout(() => {
        chessboardRef.current?.move(exercise[0]);
        setCurrentMoveIndex(1);
        currentMoveIndexRef.current = 1;
      }, 300);
    }
  };

  // ── completeExercise: show feedback, auto-advance after delay ─────────────
  const completeExercise = (
    exList: string[][],
    fen: string,
    col: RepertoireColor,
  ) => {
    setCurrentMoveIndex(0);
    currentMoveIndexRef.current = 0;

    if (currentExerciseIndexRef.current < exList.length - 1) {
      setFeedback({ type: "success", message: "Correct! Moving to next…" });
      setTimeout(() => {
        const nextIdx = currentExerciseIndexRef.current + 1;
        setCurrentExerciseIndex(nextIdx);
        currentExerciseIndexRef.current = nextIdx;
        setFeedback({ type: null, message: "" });
        startExercise(nextIdx, exList, fen, col);
      }, 1500);
    } else {
      setFeedback({
        type: "info",
        message: "All exercises completed! Well done.",
      });
    }
  };

  // ── moveHandler (passed to ChessBoard) ────────────────────────────────────
  const moveHandler = (move: Move): boolean => {
    if (
      exercises.length === 0 ||
      currentExerciseIndexRef.current >= exercises.length
    ) {
      return false;
    }

    const exercise = exercises[currentExerciseIndexRef.current];
    const moveIdx = currentMoveIndexRef.current;

    // Opponent's turn — apply without checking (shouldn't reach user callback)
    if (!isUserMoveAtIndex(moveIdx, startingFEN, color)) {
      return true;
    }

    const expectedMove = exercise[moveIdx];
    if (!expectedMove) return false;

    if (move.san === expectedMove) {
      const newMoveIndex = moveIdx + 1;
      setFeedback({ type: null, message: "" });

      if (newMoveIndex >= exercise.length) {
        completeExercise(exercises, startingFEN, color);
      } else {
        setCurrentMoveIndex(newMoveIndex);
        currentMoveIndexRef.current = newMoveIndex;

        // Auto-play opponent's response
        if (!isUserMoveAtIndex(newMoveIndex, startingFEN, color)) {
          const opponentSan = exercise[newMoveIndex];
          setTimeout(() => {
            chessboardRef.current?.move(opponentSan);
            const afterOpponent = newMoveIndex + 1;
            setCurrentMoveIndex(afterOpponent);
            currentMoveIndexRef.current = afterOpponent;

            if (afterOpponent >= exercise.length) {
              completeExercise(exercises, startingFEN, color);
            }
          }, 300);
        }
      }
      return true;
    } else {
      setFeedback({ type: "error", message: "Incorrect move. Try again!" });
      return false;
    }
  };

  // ── handleStartDrill ───────────────────────────────────────────────────────
  const handleStartDrill = () => {
    if (!selectedRepertoire) return;

    let lines = selectedRepertoire.lines.filter((l) => l.length > 0);

    if (limitDepth) {
      lines = lines
        .map((l) => l.slice(0, depthLimit))
        .filter((l) => l.length > 0);
    }

    if (randomize) {
      lines = shuffleArray(lines);
    }

    const fen = selectedRepertoire.startingFEN;
    const col = selectedRepertoire.color;

    setExercises(lines);
    setCurrentExerciseIndex(0);
    currentExerciseIndexRef.current = 0;
    setCurrentMoveIndex(0);
    currentMoveIndexRef.current = 0;
    setFeedback({ type: null, message: "" });
    setDrillStarted(true);

    // Auto-play opponent's first move if they go first from startingFEN.
    // Use a longer delay to allow the board to mount.
    if (lines.length > 0 && !isUserMoveAtIndex(0, fen, col)) {
      setTimeout(() => {
        chessboardRef.current?.move(lines[0][0]);
        setCurrentMoveIndex(1);
        currentMoveIndexRef.current = 1;
      }, 500);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      const prevIdx = currentExerciseIndex - 1;
      setCurrentExerciseIndex(prevIdx);
      currentExerciseIndexRef.current = prevIdx;
      setFeedback({ type: null, message: "" });
      startExercise(prevIdx, exercises, startingFEN, color);
    }
  };

  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      const nextIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIdx);
      currentExerciseIndexRef.current = nextIdx;
      setFeedback({ type: null, message: "" });
      startExercise(nextIdx, exercises, startingFEN, color);
    }
  };

  const handleBackToSettings = () => {
    setDrillStarted(false);
    setExercises([]);
    setCurrentExerciseIndex(0);
    currentExerciseIndexRef.current = 0;
    setCurrentMoveIndex(0);
    currentMoveIndexRef.current = 0;
    setFeedback({ type: null, message: "" });
  };

  // ── Sub-components ─────────────────────────────────────────────────────────
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
        <i className={iconClass} />
        <span>{feedback.message}</span>
      </div>
    );
  };

  const ControlsPanel = () => (
    <>
      <div className="flex justify-content-center align-items-center gap-2">
        <Button
          icon="bi bi-chevron-left"
          aria-label="Previous"
          onClick={handlePrevious}
          disabled={currentExerciseIndex === 0}
        />
        <span className="px-3">
          {currentExerciseIndex + 1} / {exercises.length}
        </span>
        <Button
          icon="bi bi-chevron-right"
          aria-label="Next"
          iconPos="right"
          onClick={handleNext}
          disabled={currentExerciseIndex >= exercises.length - 1}
        />
      </div>

      <FeedbackDisplay />

      <div className="text-center mt-2 text-sm text-color-secondary">
        <div>
          Playing as: <strong className="capitalize">{color}</strong>
        </div>
        {limitDepth && (
          <div>
            Depth limit: <strong>{depthLimit}</strong>
          </div>
        )}
      </div>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
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

  const repertoireOptions = repertoires.map((r) => ({
    label: `${r.name} (${r.color}, ${r.lines.length} line${r.lines.length !== 1 ? "s" : ""})`,
    value: r,
  }));

  return (
    <div className="p-1 flex flex-wrap align-items-center justify-content-center">
      {/* ── Setup screen ── */}
      {!drillStarted && (
        <Card
          title="Gradual Repertoire Practice"
          style={{ minWidth: "320px", maxWidth: "480px", width: "100%" }}
        >
          {/* Repertoire picker */}
          <div className="field mb-4">
            <label htmlFor="rep-select" className="block mb-2 font-semibold">
              Select Repertoire:
            </label>
            <Dropdown
              id="rep-select"
              value={selectedRepertoire}
              options={repertoireOptions}
              onChange={(e) => setSelectedRepertoire(e.value)}
              placeholder="Choose a repertoire…"
              className="w-full"
              disabled={repertoires.length === 0}
            />
            {repertoires.length === 0 && (
              <Message
                severity="info"
                text="No gradual repertoires found. Build one from the Repertoire Builder page."
                className="mt-2 w-full"
              />
            )}
          </div>

          {/* Limit move depth */}
          <div className="field mb-3">
            <div className="flex align-items-center gap-2 mb-2">
              <Checkbox
                inputId="limit-depth"
                checked={limitDepth}
                onChange={(e) => setLimitDepth(e.checked ?? false)}
              />
              <label htmlFor="limit-depth" className="cursor-pointer">
                Limit move depth
              </label>
            </div>
            <Dropdown
              value={depthLimit}
              options={DEPTH_OPTIONS}
              onChange={(e) => setDepthLimit(e.value)}
              disabled={!limitDepth}
              className="w-full"
              placeholder="Select depth…"
            />
          </div>

          {/* Randomize order */}
          <div className="field mb-4">
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="randomize"
                checked={randomize}
                onChange={(e) => setRandomize(e.checked ?? false)}
              />
              <label htmlFor="randomize" className="cursor-pointer">
                Randomize order
              </label>
            </div>
          </div>

          {/* Summary of selected repertoire */}
          {selectedRepertoire && (
            <div className="mb-3 text-sm text-color-secondary">
              Playing as:{" "}
              <strong className="capitalize">{selectedRepertoire.color}</strong>
              {" · "}
              {selectedRepertoire.lines.length} line
              {selectedRepertoire.lines.length !== 1 ? "s" : ""}
            </div>
          )}

          <Button
            label="Start Drill"
            icon="bi bi-play-fill"
            onClick={handleStartDrill}
            disabled={
              !selectedRepertoire || selectedRepertoire.lines.length === 0
            }
            size="large"
            className="p-button-success w-full"
          />
        </Card>
      )}

      {/* ── No exercises screen ── */}
      {drillStarted && exercises.length === 0 && (
        <Card title="No Exercises Found">
          <Message
            severity="warn"
            text={`No exercises found for the selected criteria${limitDepth ? ` (depth limit: ${depthLimit})` : ""}.`}
            className="mb-4"
          />
          <div className="flex justify-content-center">
            <Button
              label="Back to Settings"
              icon="bi bi-arrow-left"
              onClick={handleBackToSettings}
              className="p-button-secondary"
            />
          </div>
        </Card>
      )}

      {/* ── Drill screen ── */}
      {drillStarted &&
        exercises.length > 0 &&
        (isWideLayout ? (
          <div className="flex align-items-center gap-4">
            <ChessBoard
              name="gradual-practice"
              game_url={selectedRepertoire?.id ?? "gradual-practice"}
              fen={startingFEN}
              draggable={true}
              chessboardRef={chessboardRef}
              gameRef={gameRef}
              madeMoveRef={{ current: false }}
              moveCallback={moveHandler}
              size={`${boardSize}px`}
              invert={color === "black"}
            />
            <div className="flex flex-column gap-2">
              <ControlsPanel />
              <Button
                label="Back to Settings"
                icon="bi bi-arrow-left"
                onClick={handleBackToSettings}
                className="p-button-secondary p-button-sm mt-3"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-column gap-1">
            <div className="flex justify-content-end mb-2">
              <Button
                label="Back to Settings"
                icon="bi bi-arrow-left"
                onClick={handleBackToSettings}
                className="p-button-secondary p-button-sm"
              />
            </div>
            <ChessBoard
              name="gradual-practice"
              game_url={selectedRepertoire?.id ?? "gradual-practice"}
              fen={startingFEN}
              draggable={true}
              chessboardRef={chessboardRef}
              gameRef={gameRef}
              madeMoveRef={{ current: false }}
              moveCallback={moveHandler}
              size={`${boardSize}px`}
              invert={color === "black"}
            />
            <ControlsPanel />
          </div>
        ))}
    </div>
  );
};
