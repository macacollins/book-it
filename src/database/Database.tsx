import React, { useState, useEffect } from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { Panel } from "primereact/panel";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import { confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import {
  SavedGameClient,
  UploadedPGNClient,
  GameAnalysisClient,
  DrillResultClient,
  TacticsProgressClient,
  QueuedPositionClient,
  QueuedGameClient,
  SavedGame,
  UploadedPGN,
  GameAnalysis,
  DrillResult,
  TacticsProgress,
  QueuedPosition,
  QueuedGame,
  GameSource,
  PGNType,
} from "./index";
import { MoveTree, createMoveTree } from "../types/MoveTree";
import Game from "../types/Game";
import { calculateMoveTree } from "../integrations/calculateMoveTree";
import { PGNUpload } from "./PGNUpload";
import { syncChessComGames } from "./syncChessComGames";
import { syncLichessGames } from "./syncLichessGames";

interface DatabasePageState {
  savedGames: SavedGame[];
  uploadedPGNs: UploadedPGN[];
  gameAnalyses: GameAnalysis[];
  drillResults: DrillResult[];
  tacticsProgress: TacticsProgress[];
  queuedPositions: QueuedPosition[];
  queuedGames: QueuedGame[];
  loading: boolean;
}

export default () => {
  const [state, setState] = useState<DatabasePageState>({
    savedGames: [],
    uploadedPGNs: [],
    gameAnalyses: [],
    drillResults: [],
    tacticsProgress: [],
    queuedPositions: [],
    queuedGames: [],
    loading: true,
  });

  const [newSavedGame, setNewSavedGame] = useState<Partial<SavedGame>>({
    id: "",
    timestamp: Date.now(),
    pgn: "",
    source: "manual" as GameSource,
  });

  const [newUploadedPGN, setNewUploadedPGN] = useState<Partial<UploadedPGN>>({
    id: "",
    filename: "",
    content: "",
    type: "games" as PGNType,
  });

  const [newGameAnalysis, setNewGameAnalysis] = useState<Partial<GameAnalysis>>(
    {
      gameID: "",
      repertoireID: "",
      analysisData: {} as any,
    },
  );

  const [newDrillResult, setNewDrillResult] = useState<Partial<DrillResult>>({
    id: "",
    fen: "",
    correct: false,
    timeTakenSeconds: 0,
    timestamp: Date.now(),
  });

  const [newTacticsProgress, setNewTacticsProgress] = useState<
    Partial<TacticsProgress>
  >({
    id: "",
    tacticsSolved: [],
    totalTactics: 0,
    lastSolvedTimestamp: Date.now(),
  });

  const [newQueuedPosition, setNewQueuedPosition] = useState<
    Partial<QueuedPosition>
  >({
    id: "",
    fen: "",
    timestamp: Date.now(),
    notes: "",
  });

  const [newQueuedGame, setNewQueuedGame] = useState<Partial<QueuedGame>>({
    id: "",
    gameID: "",
    timestamp: Date.now(),
    notes: createMoveTree(),
  });

  const [chessComUsername, setChessComUsername] = useState<string>(
    () => localStorage.getItem("chessComUsername") || "",
  );
  const [lichessUsername, setLichessUsername] = useState<string>(
    () => localStorage.getItem("lichessUsername") || "",
  );
  const [lichessToken, setLichessToken] = useState<string>(
    () => localStorage.getItem("lichessToken") || "",
  );
  const [activeAccordionTabs, setActiveAccordionTabs] = useState<number[]>(
    () => {
      const saved = localStorage.getItem("databaseAccordionTabs");
      return saved ? JSON.parse(saved) : [0];
    },
  );
  const [importing, setImporting] = useState<boolean>(false);
  const [showPGNModal, setShowPGNModal] = useState<boolean>(false);
  const [showUploadPGNModal, setShowUploadPGNModal] = useState<boolean>(false);

  const toast = React.useRef<Toast>(null);

  const gameSourceOptions = [
    { label: "Chess.com", value: "chess.com" },
    { label: "Lichess", value: "lichess.org" },
    { label: "Manual", value: "manual" },
  ];

  const loadData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const [
        savedGames,
        uploadedPGNs,
        gameAnalyses,
        drillResults,
        tacticsProgress,
        queuedPositions,
        queuedGames,
      ] = await Promise.all([
        SavedGameClient.getAll(),
        UploadedPGNClient.getAll(),
        GameAnalysisClient.getAll(),
        DrillResultClient.getAll(),
        TacticsProgressClient.getAll(),
        QueuedPositionClient.getAll(),
        QueuedGameClient.getAll(),
      ]);

      setState({
        savedGames,
        uploadedPGNs,
        gameAnalyses,
        drillResults,
        tacticsProgress,
        queuedPositions,
        queuedGames,
        loading: false,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load data",
      });
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Persist chess.com username to localStorage
  useEffect(() => {
    if (chessComUsername) {
      localStorage.setItem("chessComUsername", chessComUsername);
    }
  }, [chessComUsername]);

  // Persist lichess username to localStorage
  useEffect(() => {
    if (lichessUsername) {
      localStorage.setItem("lichessUsername", lichessUsername);
    }
  }, [lichessUsername]);

  // Persist accordion tab state to localStorage
  useEffect(() => {
    localStorage.setItem(
      "databaseAccordionTabs",
      JSON.stringify(activeAccordionTabs),
    );
  }, [activeAccordionTabs]);

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: "success",
      summary: "Success",
      detail: message,
    });
  };

  const showError = (message: string) => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: message,
    });
  };

  const confirmDelete = (callback: () => Promise<void>, itemName: string) => {
    confirmDialog({
      message: `Are you sure you want to delete ${itemName}?`,
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      accept: callback,
    });
  };

  // SavedGame operations
  const createSavedGame = async () => {
    try {
      const game: SavedGame = {
        id: newSavedGame.id || `game-${Date.now()}`,
        timestamp: newSavedGame.timestamp || Date.now(),
        pgn: newSavedGame.pgn || "",
        source: newSavedGame.source || "manual",
      };

      await SavedGameClient.insert(game);
      showSuccess("Game saved successfully");
      setNewSavedGame({
        id: "",
        timestamp: Date.now(),
        pgn: "",
        source: "manual",
      });
      setShowPGNModal(false);
      loadData();
    } catch (error) {
      showError("Failed to save game");
    }
  };

  const deleteSavedGame = async (id: string) => {
    try {
      await SavedGameClient.delete(id);
      showSuccess("Game deleted successfully");
      loadData();
    } catch (error) {
      showError("Failed to delete game");
    }
  };

  // UploadedPGN operations
  const createUploadedPGN = async () => {
    try {
      const pgn: UploadedPGN = {
        id: newUploadedPGN.id || `pgn-${Date.now()}`,
        filename: newUploadedPGN.filename || "",
        content: newUploadedPGN.content || "",
        type: newUploadedPGN.type || "games",
      };

      await UploadedPGNClient.insert(pgn);
      showSuccess("PGN uploaded successfully");
      setNewUploadedPGN({ id: "", filename: "", content: "", type: "games" });
      loadData();
    } catch (error) {
      showError("Failed to upload PGN");
    }
  };

  const deleteUploadedPGN = async (id: string) => {
    try {
      await UploadedPGNClient.delete(id);
      showSuccess("PGN deleted successfully");
      loadData();
    } catch (error) {
      showError("Failed to delete PGN");
    }
  };

  // GameAnalysis operations
  const createGameAnalysis = async () => {
    try {
      const analysis: GameAnalysis = {
        gameID: newGameAnalysis.gameID || "",
        repertoireID: newGameAnalysis.repertoireID || "",
        analysisData: newGameAnalysis.analysisData || ({} as any),
      };

      await GameAnalysisClient.insert(analysis);
      showSuccess("Analysis saved successfully");
      setNewGameAnalysis({
        gameID: "",
        repertoireID: "",
        analysisData: {} as any,
      });
      loadData();
    } catch (error) {
      showError("Failed to save analysis");
    }
  };

  const deleteGameAnalysis = async (gameID: string, repertoireID: string) => {
    try {
      await GameAnalysisClient.delete(gameID, repertoireID);
      showSuccess("Analysis deleted successfully");
      loadData();
    } catch (error) {
      showError("Failed to delete analysis");
    }
  };

  // DrillResult operations
  const createDrillResult = async () => {
    try {
      const result: DrillResult = {
        id: newDrillResult.id || `drill-${Date.now()}`,
        fen: newDrillResult.fen || "",
        correct: newDrillResult.correct || false,
        timeTakenSeconds: newDrillResult.timeTakenSeconds || 0,
        timestamp: newDrillResult.timestamp || Date.now(),
      };

      await DrillResultClient.insert(result);
      showSuccess("Drill result saved successfully");
      setNewDrillResult({
        id: "",
        fen: "",
        correct: false,
        timeTakenSeconds: 0,
        timestamp: Date.now(),
      });
      loadData();
    } catch (error) {
      showError("Failed to save drill result");
    }
  };

  const deleteDrillResult = async (id: string) => {
    try {
      await DrillResultClient.delete(id);
      showSuccess("Drill result deleted successfully");
      loadData();
    } catch (error) {
      showError("Failed to delete drill result");
    }
  };

  // TacticsProgress operations
  const createTacticsProgress = async () => {
    try {
      const progress: TacticsProgress = {
        id: newTacticsProgress.id || `tactics-${Date.now()}`,
        tacticsSolved: newTacticsProgress.tacticsSolved || [],
        totalTactics: newTacticsProgress.totalTactics || 0,
        lastSolvedTimestamp:
          newTacticsProgress.lastSolvedTimestamp || Date.now(),
      };

      await TacticsProgressClient.insert(progress);
      showSuccess("Tactics progress saved successfully");
      setNewTacticsProgress({
        id: "",
        tacticsSolved: [],
        totalTactics: 0,
        lastSolvedTimestamp: Date.now(),
      });
      loadData();
    } catch (error) {
      showError("Failed to save tactics progress");
    }
  };

  const deleteTacticsProgress = async (id: string) => {
    try {
      await TacticsProgressClient.delete(id);
      showSuccess("Tactics progress deleted successfully");
      loadData();
    } catch (error) {
      showError("Failed to delete tactics progress");
    }
  };

  // QueuedPosition operations
  const createQueuedPosition = async () => {
    try {
      const position: QueuedPosition = {
        id: newQueuedPosition.id || `position-${Date.now()}`,
        fen: newQueuedPosition.fen || "",
        timestamp: newQueuedPosition.timestamp || Date.now(),
        notes: newQueuedPosition.notes || "",
      };

      await QueuedPositionClient.insert(position);
      showSuccess("Position queued successfully");
      setNewQueuedPosition({
        id: "",
        fen: "",
        timestamp: Date.now(),
        notes: "",
      });
      loadData();
    } catch (error) {
      showError("Failed to queue position");
    }
  };

  const deleteQueuedPosition = async (id: string) => {
    try {
      await QueuedPositionClient.delete(id);
      showSuccess("Position deleted successfully");
      loadData();
    } catch (error) {
      showError("Failed to delete position");
    }
  };

  // QueuedGame operations
  const createQueuedGame = async () => {
    try {
      const game: QueuedGame = {
        id: newQueuedGame.id || `qgame-${Date.now()}`,
        gameID: newQueuedGame.gameID || "",
        timestamp: newQueuedGame.timestamp || Date.now(),
        notes: newQueuedGame.notes || createMoveTree(),
      };

      await QueuedGameClient.insert(game);
      showSuccess("Game queued successfully");
      setNewQueuedGame({
        id: "",
        gameID: "",
        timestamp: Date.now(),
        notes: createMoveTree(),
      });
      loadData();
    } catch (error) {
      showError("Failed to queue game");
    }
  };

  const deleteQueuedGame = async (id: string) => {
    try {
      await QueuedGameClient.delete(id);
      showSuccess("Queued game deleted successfully");
      loadData();
    } catch (error) {
      showError("Failed to delete queued game");
    }
  };

  const renderDeleteButton = (
    data: any,
    deleteCallback: (id: string) => void,
  ) => {
    return (
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-text"
        onClick={() =>
          confirmDelete(async () => deleteCallback(data.id), data.id)
        }
        tooltip="Delete"
      />
    );
  };

  const renderAnalysisDeleteButton = (data: GameAnalysis) => {
    return (
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-text"
        onClick={() =>
          confirmDelete(
            () => deleteGameAnalysis(data.gameID, data.repertoireID),
            `${data.gameID}-${data.repertoireID}`,
          )
        }
        tooltip="Delete"
      />
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatArray = (arr: any[]) => {
    return arr.length > 0 ? `[${arr.length} items]` : "[]";
  };

  const renderFenWithCopy = (data: QueuedPosition) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="flex-1" style={{ wordBreak: "break-all" }}>
          {data.fen}
        </span>
        <Button
          icon="bi bi-copy"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => {
            navigator.clipboard.writeText(data.fen);
            showSuccess("FEN copied to clipboard");
          }}
          tooltip="Copy FEN to clipboard"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  // Game import functions
  const handleSyncChessComGames = () => {
    syncChessComGames({
      username: chessComUsername,
      onStart: () => setImporting(true),
      onComplete: () => setImporting(false),
      onSuccess: showSuccess,
      onError: showError,
      onDataChanged: loadData,
    });
  };

  const handleSyncLichessGames = () => {
    syncLichessGames({
      username: lichessUsername,
      onStart: () => setImporting(true),
      onComplete: () => setImporting(false),
      onSuccess: showSuccess,
      onError: showError,
      onDataChanged: loadData,
    });
  };

  if (state.loading) {
    return <div className="text-center p-4">Loading database contents...</div>;
  }

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <h1>Database Management</h1>
      <p className="mb-4">Manage all database tables and records.</p>

      <Accordion
        multiple
        activeIndex={activeAccordionTabs}
        onTabChange={(e) => setActiveAccordionTabs(e.index as number[])}
      >
        {/* Saved Games */}
        <AccordionTab header={`Saved Games (${state.savedGames.length})`}>
          <div className="mb-3">
            <Button
              label="Paste PGN from Clipboard..."
              icon="pi pi-clipboard"
              onClick={() => setShowPGNModal(true)}
              className="p-button-outlined"
            />
          </div>

          <Dialog
            header="Add New Saved Game"
            visible={showPGNModal}
            style={{ width: "50vw" }}
            onHide={() => setShowPGNModal(false)}
            modal
          >
            <div className="grid p-fluid">
              <div className="col-12 md:col-6">
                <label htmlFor="savedgame-id">ID</label>
                <InputText
                  id="savedgame-id"
                  value={newSavedGame.id || ""}
                  onChange={(e) =>
                    setNewSavedGame({ ...newSavedGame, id: e.target.value })
                  }
                  placeholder="Leave empty for auto-generation"
                />
              </div>
              <div className="col-12 md:col-6">
                <label htmlFor="savedgame-source">Source</label>
                <Dropdown
                  id="savedgame-source"
                  value={newSavedGame.source}
                  options={gameSourceOptions}
                  onChange={(e) =>
                    setNewSavedGame({ ...newSavedGame, source: e.value })
                  }
                />
              </div>
              <div className="col-12">
                <label htmlFor="savedgame-pgn">PGN</label>
                <InputTextarea
                  id="savedgame-pgn"
                  value={newSavedGame.pgn || ""}
                  onChange={(e) =>
                    setNewSavedGame({ ...newSavedGame, pgn: e.target.value })
                  }
                  rows={10}
                  autoFocus
                />
              </div>
              <div className="col-12">
                <Button
                  label="Add Game"
                  icon="pi pi-plus"
                  onClick={createSavedGame}
                />
              </div>
            </div>
          </Dialog>

          <div className="grid p-fluid">
            <div className="col-12 md:col-6">
              <label htmlFor="chesscom-username">Chess.com Username</label>
              <div className="p-inputgroup">
                <InputText
                  id="chesscom-username"
                  value={chessComUsername}
                  onChange={(e) => setChessComUsername(e.target.value)}
                  placeholder="Enter Chess.com username"
                  disabled={importing}
                />
                <Button
                  label="Sync"
                  icon="pi pi-sync"
                  onClick={handleSyncChessComGames}
                  disabled={importing || !chessComUsername.trim()}
                  loading={importing}
                />
              </div>
              <small className="p-text-secondary">
                Imports games from the last 3 months
              </small>
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="lichess-username">Lichess Username</label>
              <div className="p-inputgroup">
                <InputText
                  id="lichess-username"
                  value={lichessUsername}
                  onChange={(e) => setLichessUsername(e.target.value)}
                  placeholder="Enter Lichess username"
                  disabled={importing}
                />
                <Button
                  label="Sync"
                  icon="pi pi-sync"
                  onClick={handleSyncLichessGames}
                  disabled={importing || !lichessUsername.trim()}
                  loading={importing}
                />
              </div>
              <small className="p-text-secondary">
                Imports finished games from the last 3 months (max 200)
              </small>
            </div>
            <div className="col-12 md:col-6">
              <label htmlFor="lichess-token">Lichess API Token</label>
              <div className="p-inputgroup">
                <InputText
                  id="lichess-token"
                  value={lichessToken}
                  onChange={(e) => setLichessToken(e.target.value)}
                  placeholder="Enter Lichess API token"

                />
                <Button
                  label="Save"
                  icon="pi pi-save"
                  onClick={() => {
                    localStorage.setItem("lichessToken", lichessToken);
                    toast.current?.show({
                      severity: "success",
                      summary: "Success",
                      detail: "Lichess token saved",
                    });
                  }}
                />
              </div>
              <small className="p-text-secondary">
                Used for Lichess Explorer API requests
              </small>
            </div>
            {importing && (
              <div className="col-12">
                <Message
                  severity="info"
                  text="Importing games... This may take a few moments."
                />
              </div>
            )}
          </div>

          <DataTable
            value={state.savedGames}
            paginator
            rows={10}
            className="mt-3"
            sortField="timestamp"
            sortOrder={-1}
          >
            <Column field="id" header="ID" />
            <Column field="source" header="Source" />
            <Column
              field="timestamp"
              header="Timestamp"
              body={(data) => formatTimestamp(data.timestamp)}
              sortable
            />
            <Column
              field="pgn"
              header="PGN"
              body={(data) => data.pgn.substring(0, 50) + "..."}
            />
            <Column
              body={(data) => renderDeleteButton(data, deleteSavedGame)}
              style={{ width: "4rem" }}
            />
          </DataTable>
        </AccordionTab>

        {/* Uploaded PGNs */}
        <AccordionTab header={`Uploaded PGNs (${state.uploadedPGNs.length})`}>
          <div className="mb-3">
            <Button
              label="Upload PGN..."
              icon="pi pi-upload"
              onClick={() => setShowUploadPGNModal(true)}
              className="p-button-outlined"
            />
          </div>

          <PGNUpload
            visible={showUploadPGNModal}
            onHide={() => setShowUploadPGNModal(false)}
            onSuccess={showSuccess}
            onError={showError}
            onUploadComplete={loadData}
          />

          <h2>Uploaded PGNs</h2>
          <DataTable
            value={state.uploadedPGNs}
            paginator
            rows={10}
            className="mt-3"
          >
            <Column field="id" header="ID" />
            <Column field="filename" header="Filename" />
            <Column field="type" header="Type" />
            <Column
              field="content"
              header="Content"
              body={(data) => data.content.substring(0, 50) + "..."}
            />
            <Column
              body={(data) => renderDeleteButton(data, deleteUploadedPGN)}
              style={{ width: "4rem" }}
            />
          </DataTable>
        </AccordionTab>

        {/* Game Analysis */}
        <AccordionTab header={`Game Analysis (${state.gameAnalyses.length})`}>
          <Panel header="Add New Game Analysis" toggleable collapsed>
            <div className="grid p-fluid">
              <div className="col-12 md:col-6">
                <label htmlFor="analysis-gameid">Game ID</label>
                <InputText
                  id="analysis-gameid"
                  value={newGameAnalysis.gameID || ""}
                  onChange={(e) =>
                    setNewGameAnalysis({
                      ...newGameAnalysis,
                      gameID: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12 md:col-6">
                <label htmlFor="analysis-repertoireid">Repertoire ID</label>
                <InputText
                  id="analysis-repertoireid"
                  value={newGameAnalysis.repertoireID || ""}
                  onChange={(e) =>
                    setNewGameAnalysis({
                      ...newGameAnalysis,
                      repertoireID: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12">
                <Button
                  label="Add Analysis"
                  icon="pi pi-plus"
                  onClick={createGameAnalysis}
                />
              </div>
            </div>
          </Panel>

          <DataTable
            value={state.gameAnalyses}
            paginator
            rows={10}
            className="mt-3"
          >
            <Column field="gameID" header="Game ID" />
            <Column field="repertoireID" header="Repertoire ID" />
            <Column
              field="analysisData"
              header="Analysis Data"
              body={() => "[Analysis Object]"}
            />
            <Column
              body={renderAnalysisDeleteButton}
              style={{ width: "4rem" }}
            />
          </DataTable>
        </AccordionTab>

        {/* Drill Results */}
        <AccordionTab header={`Drill Results (${state.drillResults.length})`}>
          <Panel header="Add New Drill Result" toggleable collapsed>
            <div className="grid p-fluid">
              <div className="col-12 md:col-6">
                <label htmlFor="drill-id">ID</label>
                <InputText
                  id="drill-id"
                  value={newDrillResult.id || ""}
                  onChange={(e) =>
                    setNewDrillResult({ ...newDrillResult, id: e.target.value })
                  }
                  placeholder="Leave empty for auto-generation"
                />
              </div>
              <div className="col-12 md:col-6">
                <label htmlFor="drill-time">Time Taken (seconds)</label>
                <InputNumber
                  id="drill-time"
                  value={newDrillResult.timeTakenSeconds}
                  onValueChange={(e) =>
                    setNewDrillResult({
                      ...newDrillResult,
                      timeTakenSeconds: e.value || 0,
                    })
                  }
                />
              </div>
              <div className="col-12">
                <label htmlFor="drill-fen">FEN</label>
                <InputText
                  id="drill-fen"
                  value={newDrillResult.fen || ""}
                  onChange={(e) =>
                    setNewDrillResult({
                      ...newDrillResult,
                      fen: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12">
                <div className="field-checkbox">
                  <Checkbox
                    inputId="drill-correct"
                    checked={newDrillResult.correct || false}
                    onChange={(e) =>
                      setNewDrillResult({
                        ...newDrillResult,
                        correct: e.checked,
                      })
                    }
                  />
                  <label htmlFor="drill-correct">Correct</label>
                </div>
              </div>
              <div className="col-12">
                <Button
                  label="Add Result"
                  icon="pi pi-plus"
                  onClick={createDrillResult}
                />
              </div>
            </div>
          </Panel>

          <DataTable
            value={state.drillResults}
            paginator
            rows={10}
            className="mt-3"
          >
            <Column field="id" header="ID" />
            <Column
              field="fen"
              header="FEN"
              body={(data) => data.fen.substring(0, 30) + "..."}
            />
            <Column
              field="correct"
              header="Correct"
              body={(data) => (data.correct ? "✓" : "✗")}
            />
            <Column field="timeTakenSeconds" header="Time (s)" />
            <Column
              field="timestamp"
              header="Timestamp"
              body={(data) => formatTimestamp(data.timestamp)}
            />
            <Column
              body={(data) => renderDeleteButton(data, deleteDrillResult)}
              style={{ width: "4rem" }}
            />
          </DataTable>
        </AccordionTab>

        {/* Tactics Progress */}
        <AccordionTab
          header={`Tactics Progress (${state.tacticsProgress.length})`}
        >
          <Panel header="Add New Tactics Progress" toggleable collapsed>
            <div className="grid p-fluid">
              <div className="col-12 md:col-6">
                <label htmlFor="tactics-id">ID</label>
                <InputText
                  id="tactics-id"
                  value={newTacticsProgress.id || ""}
                  onChange={(e) =>
                    setNewTacticsProgress({
                      ...newTacticsProgress,
                      id: e.target.value,
                    })
                  }
                  placeholder="Leave empty for auto-generation"
                />
              </div>
              <div className="col-12 md:col-6">
                <label htmlFor="tactics-total">Total Tactics</label>
                <InputNumber
                  id="tactics-total"
                  value={newTacticsProgress.totalTactics}
                  onValueChange={(e) =>
                    setNewTacticsProgress({
                      ...newTacticsProgress,
                      totalTactics: e.value || 0,
                    })
                  }
                />
              </div>
              <div className="col-12">
                <Button
                  label="Add Progress"
                  icon="pi pi-plus"
                  onClick={createTacticsProgress}
                />
              </div>
            </div>
          </Panel>

          <DataTable
            value={state.tacticsProgress}
            paginator
            rows={10}
            className="mt-3"
          >
            <Column field="id" header="ID" />
            <Column
              field="tacticsSolved"
              header="Solved"
              body={(data) => formatArray(data.tacticsSolved)}
            />
            <Column field="totalTactics" header="Total" />
            <Column
              field="lastSolvedTimestamp"
              header="Last Solved"
              body={(data) => formatTimestamp(data.lastSolvedTimestamp)}
            />
            <Column
              body={(data) => renderDeleteButton(data, deleteTacticsProgress)}
              style={{ width: "4rem" }}
            />
          </DataTable>
        </AccordionTab>

        {/* Queued Positions */}
        <AccordionTab
          header={`Queued Positions (${state.queuedPositions.length})`}
        >
          <Panel header="Add New Queued Position">
            <div className="grid p-fluid">
              <div className="col-12">
                <label htmlFor="qpos-fen">FEN</label>
                <InputText
                  id="qpos-fen"
                  value={newQueuedPosition.fen || ""}
                  onChange={(e) =>
                    setNewQueuedPosition({
                      ...newQueuedPosition,
                      fen: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12">
                <label htmlFor="qpos-notes">Notes</label>
                <InputTextarea
                  id="qpos-notes"
                  value={newQueuedPosition.notes || ""}
                  onChange={(e) =>
                    setNewQueuedPosition({
                      ...newQueuedPosition,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
              <div className="col-12">
                <Button
                  label="Queue Position"
                  icon="pi pi-plus"
                  onClick={createQueuedPosition}
                />
              </div>
            </div>
          </Panel>

          <DataTable
            value={state.queuedPositions}
            paginator
            rows={10}
            className="mt-3"
          >
            <Column field="id" header="ID" />
            <Column field="fen" header="FEN" body={renderFenWithCopy} />
            <Column
              field="notes"
              header="Notes"
              body={(data) =>
                data.notes.substring(0, 30) +
                (data.notes.length > 30 ? "..." : "")
              }
            />
            <Column
              field="timestamp"
              header="Timestamp"
              body={(data) => formatTimestamp(data.timestamp)}
            />
            <Column
              body={(data) => renderDeleteButton(data, deleteQueuedPosition)}
              style={{ width: "4rem" }}
            />
          </DataTable>
        </AccordionTab>

        {/* Queued Games */}
        <AccordionTab header={`Queued Games (${state.queuedGames.length})`}>
          <Panel header="Add New Queued Game" toggleable collapsed>
            <div className="grid p-fluid">
              <div className="col-12 md:col-6">
                <label htmlFor="qgame-id">ID</label>
                <InputText
                  id="qgame-id"
                  value={newQueuedGame.id || ""}
                  onChange={(e) =>
                    setNewQueuedGame({ ...newQueuedGame, id: e.target.value })
                  }
                  placeholder="Leave empty for auto-generation"
                />
              </div>
              <div className="col-12 md:col-6">
                <label htmlFor="qgame-gameid">Game ID</label>
                <InputText
                  id="qgame-gameid"
                  value={newQueuedGame.gameID || ""}
                  onChange={(e) =>
                    setNewQueuedGame({
                      ...newQueuedGame,
                      gameID: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12">
                <Button
                  label="Queue Game"
                  icon="pi pi-plus"
                  onClick={createQueuedGame}
                />
              </div>
            </div>
          </Panel>

          <DataTable
            value={state.queuedGames}
            paginator
            rows={10}
            className="mt-3"
          >
            <Column field="id" header="ID" />
            <Column field="gameID" header="Game ID" />
            <Column
              field="notes"
              header="Notes"
              body={() => "[MoveTree Object]"}
            />
            <Column
              field="timestamp"
              header="Timestamp"
              body={(data) => formatTimestamp(data.timestamp)}
            />
            <Column
              body={(data) => renderDeleteButton(data, deleteQueuedGame)}
              style={{ width: "4rem" }}
            />
          </DataTable>
        </AccordionTab>
      </Accordion>
    </div>
  );
};
