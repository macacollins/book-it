import React, { useCallback, useEffect, useRef, useState } from "react";
import { GradualRepertoire, RepertoireColor } from "../database/types";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";
import { MoveFrequencyResult } from "../workers/frequencyAnalysisTypes";
import ChessBoard from "./ChessBoard";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { ProgressSpinner } from "primereact/progressspinner";
import { Chess, Move } from "chess.js";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { useCoverageCache } from "./useCoverageCache";
import { useSourceMovesStore } from "./useSourceMovesStore";
import { gradualRepertoireToPGNString } from "../pgn/gradualRepertoireToPGNString";
import { getChessableMenuItem } from "../integrations/getChessableMenuItem";
import { EditGradualRepertoire } from "./EditGradualRepertoire";
import { DeleteRepertoireLinesDialog } from "./DeleteRepertoireLinesDialog";
import { MoveSelectionTable } from "./MoveSelectionTable";
import { useSinglePositionBuilderStore } from "./useSinglePositionBuilderStore";
import { LevelProgressBar } from "./LevelProgressBar";
import { getLevelInformation } from "../analysis/getLevelInformation";
import UsageSphere from './UsageSphere';
import { useGRBWorkers } from "./GRBWorkerContext";
import { Dialog } from "primereact/dialog";
import { Accordion, AccordionTab } from "primereact/accordion";
import crossReferenceGames from "../analysis/crossReferenceGames";
import { GradualGamesTable } from "./GradualGamesTable";

function isUserTurn(fen: string, color: RepertoireColor): boolean {
  const sideToMove = fen.split(" ")[1];
  return (
    (sideToMove === "w" && color === "white") ||
    (sideToMove === "b" && color === "black")
  );
}

interface SinglePositionBuilderProps {
  initialMoves?: string[];
}

function buildPosition(startingFEN: string, moves: string[]) {
  const chess = new Chess(startingFEN);
  const appliedMoves: string[] = [];

  for (const san of moves) {
    try {
      chess.move(san);
      appliedMoves.push(san);
    } catch {
      break;
    }
  }

  return { chess, appliedMoves, fen: chess.fen() };
}

export const SinglePositionBuilder: React.FC<SinglePositionBuilderProps> = ({
  initialMoves,
}) => {
  const setupResult = useGradualRepertoireBuilderStore((s) => s.setupResult);
  const setSetupResult = useGradualRepertoireBuilderStore((s) => s.setSetupResult);

  const repertoireId = setupResult?.id ?? "";
  const name = setupResult?.name ?? "";
  const color = (setupResult?.color ?? "white") as RepertoireColor;
  const startingFEN = setupResult?.startingFEN ?? "";

  const {
    requestFrequencyAnalysis,
    requestCoverageAnalysis,
    coverageProgress,
    uncoveredPositions,
    loading,
    error,
    coveragePercentage,
  } = useGRBWorkers();

  const moves = useSinglePositionBuilderStore((s) => s.moves);
  const setMoves = useSinglePositionBuilderStore((s) => s.setMoves);
  const moveHistory = useSinglePositionBuilderStore((s) => s.moveHistory);
  const setMoveHistory = useSinglePositionBuilderStore((s) => s.setMoveHistory);
  const clearPositionCache = useSinglePositionBuilderStore((s) => s.clearPositionCache);
  const deletePending = useSinglePositionBuilderStore((s) => s.deletePending);
  const setDeletePending = useSinglePositionBuilderStore((s) => s.setDeletePending);
  const currentFEN = useSinglePositionBuilderStore((s) => s.currentFEN);
  const setCurrentFEN = useSinglePositionBuilderStore((s) => s.setCurrentFEN);
  const registerTableMoveClick = useSinglePositionBuilderStore((s) => s.registerTableMoveClick);  const setGrbLines = useSinglePositionBuilderStore((s) => s.setGrbLines);  const movesRef = useRef<MoveFrequencyResult[] | null>(null);
  const gameMatches = useSinglePositionBuilderStore((s) => s.gameMatches);
  const setGameMatches = useSinglePositionBuilderStore((s) => s.setGameMatches);
  const [pendingMove, setPendingMove] = useState<Move | null>(null);
  const clearCoverageCache = useCoverageCache((state) => state.clearCache);
  const coverageCache = useCoverageCache((state) => state.coverageCache);
  const clearSourceMoves = useSourceMovesStore((state) => state.clearSourceMoves);

  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [showUsageSphere, setShowUsageSphere] = useState(true);
  const [selectedView, setSelectedView] = useState<"moves" | "games">("moves");

  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());
  const currentFENRef = useRef(currentFEN);
  const actionsMenuRef = useRef<Menu>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [repertoireForEdit, setRepertoireForEdit] =
    useState<GradualRepertoire | null>(null);
  const [repertoire, setRepertoire] = useState<GradualRepertoire | null>(null);

  const [ showDebugModal, setShowDebugModal ] = useState<boolean>(false);

  const refreshRepertoire = () => {
    GradualRepertoireClient.getById(repertoireId).then((r) => {
      if (r) {
        setRepertoire(r);
        setGrbLines(r.lines);
      }
    });
  };

  useEffect(() => {
    refreshRepertoire();
  }, [repertoireId]);

  useEffect(() => {
    clearPositionCache();
    clearCoverageCache();
    clearSourceMoves();
    setGrbLines(null);
  }, [repertoireId]);

  useEffect(() => {
    if (!startingFEN) return;
    const position = buildPosition(startingFEN, initialMoves ?? []);
    gameRef.current = position.chess;
    setMoves(null);
    setMoveHistory(position.appliedMoves);
    setDeletePending(null);
    setPendingMove(null);
    setCurrentFEN(position.fen);
  }, [initialMoves, repertoireId, startingFEN]);

  useEffect(() => {
    if (currentFEN && chessboardRef.current) {
      chessboardRef.current.position(currentFEN);
    }
  }, [currentFEN]);

  currentFENRef.current = currentFEN;

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
    if (!currentFEN) return;
    requestFrequencyAnalysis(currentFEN);
  }, [currentFEN]);

  // Keep movesRef in sync with the store for use in non-reactive event handlers
  useEffect(() => {
    movesRef.current = moves;
  }, [moves]);

  const userTurn = isUserTurn(currentFEN, color);

  const applyMove = (move: Move, applyToGame: boolean = false) => {

    if (pauseBoardRef.current) {
      console.log("Not applying due to paused")
      return false;
    }
    const alreadyInRepertoire = movesRef.current?.some(
      (m) => m.san === move.san && m.inRepertoire,
    );

    console.log("Was in repertoire?", alreadyInRepertoire, "applyToGame?", applyToGame)

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

  const loadGameMatches = async () => {
    console.log("Loadinbg game matches.")
    if (!repertoire) return;
    setGameMatches(await crossReferenceGames(repertoire));
  }

  function syncLoadGameMatches() {
    (async () => {
      await loadGameMatches();
    })();
  }
  useEffect(syncLoadGameMatches, []);
  const handleTableMoveClick = useCallback((move: MoveFrequencyResult) => {
    const chess = new Chess(currentFEN);
    const playedMove = chess.move(move.san);
    if (!playedMove) {
      return;
    }

    if (pauseBoardRef.current) {
      console.log("Not applying due to paused")
      return;
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
      console.log("Attempting to make move on board.");
      gameRef.current = chess;
      chessboardRef.current?.position(chess.fen());
      setMoveHistory((prev) => [...prev, move.san]);
      setPendingMove(null);
      setCurrentFEN(chess.fen());
    }
  }, [currentFEN, color]);

  useEffect(() => {
    registerTableMoveClick(handleTableMoveClick);
    return () => registerTableMoveClick(null);
  }, [handleTableMoveClick]);

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

  if (!setupResult) return null;

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

  return (
    <div className="p-3">
      <div className="flex align-items-center gap-3 mb-3">
        <h3 className="m-0">{name}</h3>
        <Button
          aria-label="Home"
          icon="bi bi-house"
          className="p-button-outlined"
          onClick={() => setSetupResult(null)}
        />
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
                  command: requestCoverageAnalysis,
                },
                {
                  label: "GRB Diff",
                  icon: "bi bi-intersect",
                  command: () => {
                    window.location.hash = `#/grb-diff`;
                  },
                },
                {
                  label: "Cross-reference Games",
                  icon: "bi bi-controller",
                  command: loadGameMatches,
                },
                {
                  label: showUsageSphere ? "Hide Usage Sphere" : "Show Usage Sphere",
                  icon: showUsageSphere ? "bi bi-eye-slash" : "bi bi-eye",
                  command: () => setShowUsageSphere((v) => !v),
                },
                {
                  label: "Show Debug Modal",
                  icon: "bi bi-stars",
                  command: () => setShowDebugModal(true),
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
            onBoardReady={() => {
              if (currentFENRef.current) {
                chessboardRef.current?.position(currentFENRef.current);
              }
            }}
            size="376px"
          />
          {showUsageSphere && (
          <div className="flex align-items-center justify-content-center mt-3">
            <UsageSphere
              moves={moves ?? []}
              coveragePercentage={coverageCache[currentFEN]?.coverage ?? coveragePercentage}
              isUserTurn={userTurn}
              onMoveClick={handleTableMoveClick}
            />
          </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <Button
              label="Moves"
              outlined={selectedView !== "moves"}
              onClick={() => setSelectedView("moves")}
            />
            <Button
              label="Games"
              outlined={selectedView !== "games"}
              onClick={() => setSelectedView("games")}
            />
          </div>
          {selectedView === "moves" ? (
            <>
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

          <MoveSelectionTable />
          {moves && moves.length === 0 && (
            <p>No moves found in the database for this position.</p>
          )}
            </>
          ) : (
            <GradualGamesTable loadData={syncLoadGameMatches}/>
          )}
        </div>
      </div>

      <DeleteRepertoireLinesDialog
        deletePending={deletePending}
        onHide={() => setDeletePending(null)}
        onConfirm={handleDeleteConfirm}
      />

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

      { showDebugModal && 
      <Dialog header="Debug" visible={showDebugModal} onHide={() => setShowDebugModal(false)} style={{ width: "700px" }}>
        <Accordion multiple>
          <AccordionTab header="GradualRepertoire Builder Store">
            <pre style={{ overflow: "auto", maxHeight: "300px" }}>{JSON.stringify({ setupResult, initialMoves }, undefined, 2)}</pre>
          </AccordionTab>
          <AccordionTab header="Single Position Builder Store">
            <pre style={{ overflow: "auto", maxHeight: "300px" }}>{JSON.stringify({ moves, moveHistory, deletePending, currentFEN }, undefined, 2)}</pre>
          </AccordionTab>
          <AccordionTab header="GRB Workers">
            <pre style={{ overflow: "auto", maxHeight: "300px" }}>{JSON.stringify({ coverageProgress, uncoveredPositions, loading, error, coveragePercentage }, undefined, 2)}</pre>
          </AccordionTab>
          <AccordionTab header="Coverage Cache">
            <pre style={{ overflow: "auto", maxHeight: "300px" }}>{JSON.stringify({ coverageCache }, undefined, 2)}</pre>
          </AccordionTab>
          <AccordionTab header="Component State">
            <pre style={{ overflow: "auto", maxHeight: "300px" }}>{JSON.stringify({ pendingMove, deleteMessage, showUsageSphere, showEditDialog, repertoireForEdit, repertoire, showDebugModal }, undefined, 2)}</pre>
          </AccordionTab>
          <AccordionTab header="Derived">
            <pre style={{ overflow: "auto", maxHeight: "300px" }}>{JSON.stringify({ userTurn, name, color, startingFEN, repertoireId }, undefined, 2)}</pre>
          </AccordionTab>
        </Accordion>
      </Dialog>}
    </div>
  );
};
