import React, { useEffect, useRef, useState } from "react";
import { GradualRepertoire, RepertoireColor } from "../database/types";
import { MoveSource } from "./MoveSourceChooser";
import {
  MoveFrequencyResult,
  FrequencyWorkerOutbound,
} from "../workers/frequencyAnalysisTypes";
import { CoverageWorkerOutbound } from "../workers/coverageAnalysisTypes";
import {
  UncoveredPosition,
  UncoveredPositionsWorkerOutbound,
} from "../workers/uncoveredPositionsTypes";
import ChessBoard from "./ChessBoard";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import { Chess, Move } from "chess.js";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { useCoverageCache } from "./useCoverageCache";
import { CachedCoverage } from "./CachedCoverage";
import { useSourceMovesStore } from "./useSourceMovesStore";
import { InSourceIndicator } from "./InSourceIndicator";
import { gradualRepertoireToPGNString } from "../pgn/gradualRepertoireToPGNString";
import { getChessableMenuItem } from "../integrations/getChessableMenuItem";
import { EditGradualRepertoire } from "./EditGradualRepertoire";
import { LevelProgressBar } from "./LevelProgressBar";
import { getLevelInformation } from "../analysis/getLevelInformation";

interface SinglePositionBuilderProps {
  repertoireId: string;
  name: string;
  color: RepertoireColor;
  startingFEN: string;
  sourceRepertoireId: string | null;
  moveSource: MoveSource;
  token: string;
  onHome?: () => void;
}

interface PositionAnalysisCacheEntry {
  moves: MoveFrequencyResult[];
  coveragePercentage: number;
}

function isUserTurn(fen: string, color: RepertoireColor): boolean {
  const sideToMove = fen.split(" ")[1];
  return (
    (sideToMove === "w" && color === "white") ||
    (sideToMove === "b" && color === "black")
  );
}

export const SinglePositionBuilder: React.FC<SinglePositionBuilderProps> = ({
  repertoireId,
  name,
  color,
  startingFEN,
  sourceRepertoireId,
  moveSource,
  token,
  onHome,
}) => {
  const [moves, setMoves] = useState<MoveFrequencyResult[] | null>(null);
  const [coveragePercentage, setCoveragePercentage] = useState<number>(0);
  const movesRef = useRef<MoveFrequencyResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<Move | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [positionAnalysisCache, setPositionAnalysisCache] = useState<
    Record<string, PositionAnalysisCacheEntry>
  >({});
  const addPosition = useCoverageCache((state) => state.addPosition);
  const clearCoverageCache = useCoverageCache((state) => state.clearCache);
  const coverageCache = useCoverageCache((state) => state.coverageCache);
  const setSourceMoves = useSourceMovesStore((state) => state.setSourceMoves);
  const clearSourceMoves = useSourceMovesStore((state) => state.clearSourceMoves);
  const [coverageProgress, setCoverageProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const coverageWorkerRef = useRef<Worker | null>(null);
  const uncoveredPositionsWorkerRef = useRef<Worker | null>(null);
  const [uncoveredPositions, setUncoveredPositions] = useState<UncoveredPosition[]>([]);

  const [deletePending, setDeletePending] = useState<{
    san: string;
    count: number;
  } | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());
  const actionsMenuRef = useRef<Menu>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [repertoireForEdit, setRepertoireForEdit] =
    useState<GradualRepertoire | null>(null);
  const [repertoire, setRepertoire] = useState<GradualRepertoire | null>(null);

  const refreshRepertoire = () => {
    GradualRepertoireClient.getById(repertoireId).then((r) => {
      if (r) setRepertoire(r);
    });
  };

  useEffect(() => {
    refreshRepertoire();
  }, [repertoireId]);

  const [currentFEN, setCurrentFEN] = useState<string>(startingFEN);

  const getPositionCacheKey = (fen: string): string => `${repertoireId}:${fen}`;

  useEffect(() => {
    setPositionAnalysisCache({});
    clearCoverageCache();
    clearSourceMoves();
    setCoverageProgress(null);
    setUncoveredPositions([]);
    if (coverageWorkerRef.current) {
      coverageWorkerRef.current.terminate();
      coverageWorkerRef.current = null;
    }
    if (uncoveredPositionsWorkerRef.current) {
      uncoveredPositionsWorkerRef.current.terminate();
      uncoveredPositionsWorkerRef.current = null;
    }
  }, [repertoireId]);

  // Terminate workers on unmount
  useEffect(() => {
    return () => {
      coverageWorkerRef.current?.terminate();
      uncoveredPositionsWorkerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    setDeleteMessage(null);
  }, [currentFEN]);

  const pauseBoardRef = useRef(false);

  useEffect(() => {
    console.log("pauseBoardRef", pauseBoardRef)
    pauseBoardRef.current = !!pendingMove;
    console.log("pauseBoardRef", pauseBoardRef)
  }, [pendingMove]);

  useEffect(() => {
    const cacheKey = getPositionCacheKey(currentFEN);
    const cachedPosition = positionAnalysisCache[cacheKey];
    if (cachedPosition) {
      setMoves(cachedPosition.moves);
      setCoveragePercentage(cachedPosition.coveragePercentage);
      movesRef.current = cachedPosition.moves;
      // setLoading(false);
      setError(null);
    }

    console.log(
      "position changed, firing up frequency analysis worker",
      currentFEN,
    );
    // setLoading(true);
    const worker = new Worker(
      new URL("../workers/FrequencyAnalysisWorker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<FrequencyWorkerOutbound>) => {
      const msg = event.data;
      if (msg.type === "FREQUENCY_ANALYSIS_RESULT") {
        console.log("Got moves back.", msg.moves);

        if (msg.fen === currentFEN) {
          setLoading((_current) => true);
          setTimeout(() => setLoading((_current) => false), 100);
        }
        setMoves(msg.moves);
        setCoveragePercentage(msg.coveragePercentage);
        movesRef.current = msg.moves;
        setPositionAnalysisCache((prev) => ({
          ...prev,
          [cacheKey]: {
            moves: msg.moves,
            coveragePercentage: msg.coveragePercentage,
          },
        }));
        setLoading(false);
        if (!coverageWorkerRef.current) {
          handleCoverageAnalysis();
          handleUncoveredPositionsAnalysis();
        }
      } else if (msg.type === "FREQUENCY_ANALYSIS_ERROR") {
        console.log("Got error back.");

        setError(msg.error);
        setLoading(false);
      }
    };

    worker.postMessage({
      type: "ANALYZE_FREQUENCY",
      fen: currentFEN,
      repertoireId,
      token,
    });

    return () => {
      worker.terminate();
    };
  }, [currentFEN]);

  const userTurn = isUserTurn(currentFEN, color);

  const applyMove = (move: Move, applyToGame: boolean = false) => {

    if (pauseBoardRef.current) {
      console.log("Not applying due to paused")
      return false;
    }
    const alreadyInRepertoire = movesRef.current?.some(
      (m) => m.san === move.san && m.inRepertoire,
    );

    console.log("Was in repertoire?", alreadyInRepertoire)

    if (applyToGame) {

      const chess = new Chess(currentFEN);
      chess.move(move.san);
      gameRef.current = chess;
      // gameRef.current?.move(move.san);
    }

    if (isUserTurn(move.before, color) && !alreadyInRepertoire) {
      console.log("Offering to add move to repertoire");
      setPendingMove(move);
    } else {
            console.log("Trying to apply move", move)

      chessboardRef.current?.move(move.san);
      console.log("NEW FEN", move.after);
      setMoveHistory((prev) => [...prev, move.san]);
      setCurrentFEN(move.after || currentFEN);
    }
  };

  const handleMoveCallback = (move: Move): boolean => {

    applyMove(move);
    return true;
  };

  const handleAddToRepertoire = async () => {
    if (!pendingMove) return;
    const line = [...moveHistory, pendingMove.san];
    await GradualRepertoireClient.addLine(repertoireId, line);
    setMoveHistory((prev) => [...prev, pendingMove.san]);
    setCurrentFEN(pendingMove.after);
    setPendingMove(null);
    refreshRepertoire();
  };

  const handleBack = () => {
    if (moveHistory.length === 0) return;
    const newHistory = moveHistory.slice(0, -1);
    const chess = new Chess(startingFEN);
    for (const san of newHistory) {
      chess.move(san);
    }
    const newFEN = chess.fen();
    gameRef.current = chess;
    chessboardRef.current?.position(newFEN);
    setMoveHistory(newHistory);
    setPendingMove(null);
    setCurrentFEN(newFEN);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handleBack();
      }
      if (e.key === "ArrowRight") {
        const repertoireMoves = (movesRef.current ?? []).filter(
          (m) => m.inRepertoire,
        );
        if (repertoireMoves.length === 0) return;
        const best = repertoireMoves.reduce((a, b) =>
          b.totalGames > a.totalGames ? b : a,
        );
        const chess = new Chess(currentFEN);
        chess.move(best.san);
        gameRef.current = chess;
        chessboardRef.current?.position(chess.fen());
        setMoveHistory((prev) => [...prev, best.san]);
        setPendingMove(null);
        setCurrentFEN(chess.fen());
      }
      if (e.key === "l") {
        handleOpenInLichess();
      }
      if (e.key === "n") {
        if (uncoveredPositions.length === 0) return;
        const best = uncoveredPositions[0];
        const chess = new Chess(startingFEN);
        for (const san of best.startingMoves) {
          chess.move(san);
        }
        gameRef.current = chess;
        chessboardRef.current?.position(chess.fen());
        setMoveHistory(best.startingMoves);
        setPendingMove(null);
        setCurrentFEN(chess.fen());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moveHistory, startingFEN, uncoveredPositions, currentFEN]);

  const handleTableMoveClick = (move: MoveFrequencyResult) => {
    const chess = new Chess(currentFEN);
    const playedMove = chess.move(move.san);
    if (!playedMove) {
      return;
    }

    if (pauseBoardRef.current) {
      console.log("Not applying due to paused")
      return false;
    }
    const alreadyInRepertoire = movesRef.current?.some(
      (m) => m.san === move.san && m.inRepertoire,
    );

    console.log("Was in repertoire?", alreadyInRepertoire)

    if (!isUserTurn(move.resultingFen, color) && !alreadyInRepertoire) {
      console.log("Offering to add move to repertoire");
      setPendingMove(playedMove);
      gameRef.current = chess;
      chessboardRef.current?.position(chess.fen());
    } else {


      gameRef.current = chess;
      chessboardRef.current?.position(chess.fen());
      setMoveHistory((prev) => [...prev, move.san]);
      setPendingMove(null);
      setCurrentFEN(chess.fen());
    }
  };

  const handleDeleteClick = async (move: MoveFrequencyResult) => {
    const repertoire = await GradualRepertoireClient.getById(repertoireId);
    if (!repertoire) return;
    const prefix = [...moveHistory, move.san];
    const count = repertoire.lines.filter((line) =>
      prefix.every((san, i) => line[i] === san),
    ).length;
    setDeletePending({ san: move.san, count });
  };

  const handleDeleteConfirm = async () => {
    if (!deletePending) return;
    const repertoire = await GradualRepertoireClient.getById(repertoireId);
    if (!repertoire) return;
    const prefix = [...moveHistory, deletePending.san];
    const remaining = repertoire.lines.filter(
      (line) => !prefix.every((san, i) => line[i] === san),
    );
    await GradualRepertoireClient.updateLines(repertoireId, remaining);
    const deleted = repertoire.lines.length - remaining.length;
    setDeletePending(null);
    setDeleteMessage(
      `Deleted ${deleted} line${deleted !== 1 ? "s" : ""} from repertoire.`,
    );
    refreshRepertoire();
  };

  const handleCoverageAnalysis = () => {
    if (coverageWorkerRef.current) {
      coverageWorkerRef.current.terminate();
    }
    setCoverageProgress({ completed: 0, total: 0 });

    const worker = new Worker(
      new URL("../workers/CoverageAnalysisWorker.ts", import.meta.url),
      { type: "module" },
    );
    coverageWorkerRef.current = worker;

    worker.onmessage = (event: MessageEvent<CoverageWorkerOutbound>) => {
      // console.log(event);
      const msg = event.data;
      if (msg.type === "COVERAGE_PROGRESS") {
        setCoverageProgress({ completed: msg.completed, total: msg.total });
      } else if (msg.type === "COVERAGE_POSITION_RESULT") {
        if (msg.fen === currentFEN) {
          setLoading((_current) => false);
          setTimeout(() => setLoading((_current) => false), 100);
        }
        addPosition(msg.fen, {
          coverage: msg.coverage,
          totalGames: msg.totalGames,
          movePath: msg.movePath,
        });
        if (msg.fen === startingFEN) {
          GradualRepertoireClient.updateCachedCoveragePercent(
            repertoireId,
            msg.coverage,
          );
        }
      } else if (msg.type === "SOURCE_REPERTOIRE_LOADED") {
        setSourceMoves(msg.sourceMovesFromFen);
      } else if (msg.type === "COVERAGE_COMPLETE") {
        setCoverageProgress(null);
        coverageWorkerRef.current = null;
      } else if (msg.type === "COVERAGE_ERROR") {
        console.error("Coverage analysis error:", msg.error);
        setCoverageProgress(null);
        coverageWorkerRef.current = null;
      }
    };

    worker.postMessage({
      type: "ANALYZE_COVERAGE",
      repertoireId,
      token,
      color,
    });
  };

  const handleUncoveredPositionsAnalysis = () => {
    if (uncoveredPositionsWorkerRef.current) {
      uncoveredPositionsWorkerRef.current.terminate();
    }

    const worker = new Worker(
      new URL("../workers/UncoveredPositionsWorker.ts", import.meta.url),
      { type: "module" },
    );
    uncoveredPositionsWorkerRef.current = worker;

    worker.onmessage = (
      event: MessageEvent<UncoveredPositionsWorkerOutbound>,
    ) => {
      const msg = event.data;
      if (msg.type === "UNCOVERED_POSITIONS_RESULT") {
        setUncoveredPositions(msg.positions);
        uncoveredPositionsWorkerRef.current = null;
      } else if (msg.type === "UNCOVERED_POSITIONS_ERROR") {
        console.error("Uncovered positions analysis error:", msg.error);
        uncoveredPositionsWorkerRef.current = null;
      }
    };

    worker.postMessage({
      type: "RANK_UNCOVERED_POSITIONS",
      repertoireId,
      token,
    });
  };

  const handleOpenInLichess = () => {
    const lichessUrl = `https://lichess.org/analysis/${
      currentFEN
    }`;
    window.open(lichessUrl, "_blank", "noopener,noreferrer");
  };

  const handleExport = async () => {
    const repertoire = await GradualRepertoireClient.getById(repertoireId);
    if (!repertoire) return;

    const content = gradualRepertoireToPGNString(repertoire);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div
        className="flex align-items-center justify-content-center"
        style={{ height: "60vh" }}
      >
        <div className="text-center">
          <ProgressSpinner />
          <p className="mt-3">Analyzing position frequencies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <h3>{name}</h3>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const percentageTemplate = (row: MoveFrequencyResult) =>
    `${row.percentage.toFixed(1)}%`;

  const winRateTemplate = (row: MoveFrequencyResult) =>
    `${row.winRate.toFixed(1)}%`;

  const inRepertoireTemplate = (row: MoveFrequencyResult) =>
    row.inRepertoire ? "Y" : "N";

  const inSourceTemplate = (row: MoveFrequencyResult) => (
    <InSourceIndicator fen={currentFEN} san={row.san} />
  );

  const deleteTemplate = (row: MoveFrequencyResult) => (
    <Button
      icon="bi bi-trash"
      className="p-button-danger p-button-text p-button-sm"
      onClick={(e) => {
        e.stopPropagation();
        handleDeleteClick(row);
      }}
    />
  );

  return (
    <div className="p-3">
      <div className="flex align-items-center gap-3 mb-3">
        <h3 className="m-0">{name}</h3>
        {onHome && (
          <Button
            aria-label="Home"
            icon="bi bi-house"
            className="p-button-outlined"
            onClick={onHome}
          />
        )}
        <Menu
          model={[
            {
              label: "",
              items: [
                {
                  label: "Back",
                  icon: "bi bi-arrow-left",
                  disabled: moveHistory.length === 0,
                  command: handleBack,
                },
                {
                  label: "Export",
                  icon: "bi bi-download",
                  command: handleExport,
                },
                {
                  label: "Open in Lichess",
                  icon: "bi bi-box-arrow-up-right",
                  command: handleOpenInLichess,
                },
                getChessableMenuItem(currentFEN),
                {
                  label: "Edit Repertoire",
                  icon: "bi bi-pencil",
                  command: async () => {
                    const rep = await GradualRepertoireClient.getById(
                      repertoireId,
                    );
                    if (rep) {
                      setRepertoireForEdit(rep);
                      setShowEditDialog(true);
                    }
                  },
                },
                {
                  label: coverageProgress
                    ? `Coverage (${coverageProgress.completed}/${coverageProgress.total})`
                    : "Coverage",
                  icon: "bi bi-graph-up",
                  disabled: coverageProgress !== null,
                  command: handleCoverageAnalysis,
                },
              ],
            },
          ]}
          popup
          ref={actionsMenuRef}
          id="spb-actions-menu"
        />
        <Button
          aria-label="Actions"
          icon="bi bi-three-dots"
          className="p-button-outlined"
          onClick={(e) => actionsMenuRef.current?.toggle(e)}
          aria-controls="spb-actions-menu"
          aria-haspopup
        />
        <span className="text-sm text-color-secondary">
          Depth: {moveHistory.length}
        </span>
        <span className="text-sm text-color-secondary">
          {coverageCache[currentFEN] !== undefined
            ? `Coverage: ${coverageCache[currentFEN].coverage.toFixed(1)}%`
            : !userTurn
            ? `Coverage: ${coveragePercentage.toFixed(1)}%`
            : null}
        </span>
        {repertoire && (
         <div style={{ "width": "100px"}}> <LevelProgressBar levelInformation={getLevelInformation(repertoire)} />
        
        </div>

        )}
      </div>


      <div className="flex flex-column md:flex-row gap-3">
        <div>
          <ChessBoard
            name="single-position-builder"
            game_url="fen-editor"
            fen={startingFEN}
            invert={color === "black"}
            draggable={true}
            madeMoveRef={{ current: false }}
            moveCallback={handleMoveCallback}
            chessboardRef={chessboardRef}
            gameRef={gameRef}
            size="376px"
          />
        </div>
        <div className="flex-1">
          {userTurn ? (
            <>
              <h4>What move do you want to play in this position?</h4>
              {pendingMove ? (
                <div className="flex align-items-center gap-3 mb-3 p-3 surface-card border-round">
                  <span className="text-xl font-bold">{pendingMove.san}</span>
                  <Button
                    label="Add to Repertoire"
                    icon="bi bi-plus"
                    onClick={handleAddToRepertoire}
                  />
                  <Button
                    label="Cancel"
                    icon="bi bi-x"
                    className="p-button-secondary"
                    onClick={() => {
                      setPendingMove(() => null);
                      // pauseBoardRef.current = false;
                      // handleBack();

                      gameRef.current = new Chess(currentFEN);
                      chessboardRef.current?.position(currentFEN);
                    }}
                  />
                </div>
              ) : (
                <p>Make a move on the board to add it to your repertoire.</p>
              )}
            </>
          ) : (
            <h4>Potential moves by the opponent in this position</h4>
          )}
          {moves && moves.length > 0 && !loading && (
            <DataTable
              value={moves}
              size="small"
              stripedRows
              rowHover
              style={{ cursor: "pointer" }}
              onRowClick={(event) =>
                handleTableMoveClick(event.data as MoveFrequencyResult)
              }
            >
              <Column field="san" header="Move" />
              <Column header="%" body={percentageTemplate} />
              <Column field="totalGames" header="Games" />
              <Column header="Win Rate" body={winRateTemplate} />
              {/*This one is for the lines in the lines property */}
              <Column header="In GRB" body={inRepertoireTemplate} />
              {/* New one is for lines from the linked source repertoire*/}
              {sourceRepertoireId && (
                <Column header="In Source" body={inSourceTemplate} />
              )}
              <Column
                header="Cov."
                body={(row: MoveFrequencyResult) => {
                  const cached = positionAnalysisCache[getPositionCacheKey(row.resultingFen)];
                  const fallback = cached
                    ? `${cached.coveragePercentage.toFixed(1)}%`
                    : undefined;
                  return <CachedCoverage row={row} fallbackCoverage={fallback} />;
                }}
              />
              <Column body={deleteTemplate} style={{ width: "3rem" }} />
            </DataTable>
          )}
          {moves && moves.length === 0 && (
            <p>No moves found in the database for this position.</p>
          )}
        </div>
      </div>

      <Dialog
        header="Delete Repertoire Lines"
        visible={deletePending !== null}
        style={{ width: "22rem" }}
        onHide={() => setDeletePending(null)}
        modal
        footer={
          <div className="flex gap-2 justify-content-end">
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => setDeletePending(null)}
            />
            <Button
              label="Confirm"
              className="p-button-danger"
              onClick={handleDeleteConfirm}
            />
          </div>
        }
      >
        <p>
          This will delete{" "}
          <strong>{deletePending?.count}</strong>{" "}
          line{deletePending?.count !== 1 ? "s" : ""} from your repertoire.
          Are you sure?
        </p>
      </Dialog>

      {deleteMessage && (
        <div className="flex align-items-center gap-2 mt-2 p-2 surface-card border-round">
          <i className="bi bi-check-circle text-green-500" />
          <span className="flex-1 text-sm">{deleteMessage}</span>
          <Button
            icon="bi bi-x"
            className="p-button-text p-button-sm"
            onClick={() => setDeleteMessage(null)}
          />
        </div>
      )}

      {showEditDialog && repertoireForEdit && (
        <EditGradualRepertoire
          visible={showEditDialog}
          onHide={() => setShowEditDialog(false)}
          repertoire={repertoireForEdit}
          onSaved={(updated) => {
            setRepertoireForEdit(updated);
          }}
        />
      )}
    </div>
  );
};
