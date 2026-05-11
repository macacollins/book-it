import React, { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Chess } from "chess.js";
import ChessBoard from "./ChessBoard";
import { calculateMoveTreeFromParsedPGN } from "../integrations/calculateMoveTree";
import { MoveTree } from "../types/MoveTree";
import pgnParser, { ParsedPGN } from "pgn-parser";
import {
  getGameAnnotations,
  getNotesWordCount,
  saveGameAnnotations,
} from "../services/AnnotationsService";
import { useResizeListener } from "primereact/hooks";
import { SavedGameClient } from "../database/SavedGameClient";
import { SavedGame } from "../database/types";

interface GameAnnotatorProps {
  className?: string;
}

interface GameRow {
  id: string;
  date: string;
  eco?: string;
  result?: string;
  pgn: string;
  white?: string;
  black?: string;
  timeControl?: string;
  termination?: string;
  event?: string;
  site?: string;
  opening?: string;
  source: string;
  createdAt: number;
  annotationWordCount: number;
}

const startingFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const convertSavedGameToGameRow = (savedGame: SavedGame): GameRow => {
  // Try to parse PGN to extract game metadata
  let white = "Unknown";
  let black = "Unknown";
  let result = "1/2-1/2";
  let eco = "Unknown";
  let opening = "Unknown";
  let event = "Unknown";
  let site: string = savedGame.source;
  let timeControl = "Unknown";
  let termination = "Unknown";

  try {
    const parsedPGNs = pgnParser.parse(savedGame.pgn);
    if (parsedPGNs.length > 0 && parsedPGNs[0].headers) {
      const headers = parsedPGNs[0].headers;
      const getHeader = (name: string) => {
        const header = headers.find((h) => h.name === name);
        return header?.value || null;
      };

      white = getHeader("White") || "Unknown";
      black = getHeader("Black") || "Unknown";
      result = getHeader("Result") || "1/2-1/2";
      eco = getHeader("ECO") || "Unknown";
      opening = getHeader("Opening") || eco;
      event = getHeader("Event") || "Unknown";
      site = getHeader("Site") || savedGame.source;
      timeControl = getHeader("TimeControl") || "Unknown";
      termination = getHeader("Termination") || "Unknown";
    }
  } catch (err) {
    console.warn("Error parsing PGN for game metadata:", err);
  }

  return {
    id: savedGame.id,
    date: new Date(savedGame.timestamp).toLocaleDateString(),
    eco,
    result,
    pgn: savedGame.pgn,
    white,
    black,
    timeControl,
    termination,
    event,
    site,
    opening,
    source: savedGame.source,
    createdAt: savedGame.timestamp,
    annotationWordCount: getNotesWordCount(savedGame.id),
  };
};

const GameAnnotator: React.FC<GameAnnotatorProps> = ({ className = "" }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [games, setGames] = useState<GameRow[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [currentMoveTree, setCurrentMoveTree] = useState<MoveTree | null>(null);
  const [currentPosition, setCurrentPosition] = useState(startingFEN);
  const [positionNotes, setPositionNotes] = useState<string>("");
  const [savedNotes, setSavedNotes] = useState<Map<string, string>>(new Map());
  const [expandedRows, setExpandedRows] = useState<any>({});
  const [boardSize, setBoardSize] = useState<string>("400px");
  const [isNotesFocused, setIsNotesFocused] = useState<boolean>(false);

  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const boardUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBoardPositionRef = useRef<string | null>(null);
  const toast = useRef<Toast>(null);

  const [{ width: screenWidth, height: screenHeight }, setEventData] = useState(
    { width: 0, height: 0 },
  );

  const [bindWindowResizeListener, unbindWindowResizeListener] =
    useResizeListener({
      listener: (event) => {
        setEventData({
          // @ts-expect-error yeah
          width: event.currentTarget?.innerWidth || 0,
          // @ts-expect-error yeah
          height: event.currentTarget?.innerHeight || 0,
        });
      },
    });

  const updateBoardPosition = (targetFen: string) => {
    // Cache the desired position
    pendingBoardPositionRef.current = targetFen;
    console.log("Starting update logic");

    // Clear existing timeout if any
    if (boardUpdateTimeoutRef.current) {
      clearTimeout(boardUpdateTimeoutRef.current);
    }

    // Set a new timeout to update the board position after 200ms
    boardUpdateTimeoutRef.current = setTimeout(() => {
      if (chessboardRef.current && pendingBoardPositionRef.current) {
        chessboardRef.current.position(pendingBoardPositionRef.current);
        pendingBoardPositionRef.current = null;

        console.log("Did the thing");
      }
    }, 200);
  };

  useEffect(() => {
    setEventData({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    bindWindowResizeListener();

    return () => {
      unbindWindowResizeListener();
    };
  }, [bindWindowResizeListener, unbindWindowResizeListener]);

  // Initialize component by loading games from database
  useEffect(() => {
    const loadGamesFromDatabase = async () => {
      try {
        setLoading(true);
        const savedGames = await SavedGameClient.getAll();

        const gameRows: GameRow[] = savedGames.map(convertSavedGameToGameRow);

        // Sort by timestamp (newest first)
        gameRows.sort((a, b) => b.createdAt - a.createdAt);

        setGames(gameRows);
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Loaded ${gameRows.length} games from database`,
        });

        // Try to restore cached game state
        const cachedGameId = localStorage.getItem(
          "game-annotator-current-game-id",
        );
        const cachedMoveIndex = localStorage.getItem(
          "game-annotator-current-move-index",
        );

        if (cachedGameId && cachedMoveIndex) {
          const gameToRestore = gameRows.find(
            (game) => game.id === cachedGameId,
          );
          if (gameToRestore) {
            setTimeout(async () => {
              await loadGame(gameToRestore, parseInt(cachedMoveIndex, 10));
            }, 100);
          }
        }
      } catch (err) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: `Failed to load games: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
        console.error("Error loading games:", err);
      } finally {
        setLoading(false);
      }
    };

    loadGamesFromDatabase();
  }, []); // Run once on component mount

  // Keyboard navigation effect
  useEffect(() => {
    if (!currentMoveTree) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isNotesFocused) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousMove();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextMove();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentMoveTree, currentMoveIndex, isNotesFocused]);

  // Update notes when position changes
  useEffect(() => {
    if (currentPosition) {
      // Clear any pending save when position changes
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      //   if (boardUpdateTimeoutRef.current) {
      //     clearTimeout(boardUpdateTimeoutRef.current);
      //   }

      const existingNotes = savedNotes.get(currentPosition) || "";
      setPositionNotes(existingNotes);
    }
  }, [currentPosition, savedNotes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (boardUpdateTimeoutRef.current) {
        clearTimeout(boardUpdateTimeoutRef.current);
      }
    };
  }, []);

  // ResizeObserver to track board container size and update board accordingly
  useEffect(() => {
    if (!boardContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Calculate board size based on available space, leaving room for controls
        // Use the smaller dimension minus padding for a square board
        const availableSize = Math.min(width - 20, height - 20); // Account for padding and controls
        setBoardSize(`${availableSize}px`);
      }
    });

    resizeObserver.observe(boardContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [boardContainerRef.current]);

  const cacheGameState = (gameId: string | null, moveIndex: number) => {
    try {
      if (gameId) {
        localStorage.setItem("game-annotator-current-game-id", gameId);
        localStorage.setItem(
          "game-annotator-current-move-index",
          moveIndex.toString(),
        );
      } else {
        localStorage.removeItem("game-annotator-current-game-id");
        localStorage.removeItem("game-annotator-current-move-index");
      }
    } catch (err) {
      console.warn("Error caching game state:", err);
    }
  };

  const loadGame = async (game: GameRow, moveIndex: number = 0) => {
    if (!game.pgn) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Game PGN not available.",
      });
      return;
    }

    try {
      const parsedPGNs: ParsedPGN[] = pgnParser.parse(game.pgn);

      if (parsedPGNs.length === 0) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No valid PGN found in the game.",
        });
        return;
      }

      const firstPGN = parsedPGNs[0];
      const moveTree = calculateMoveTreeFromParsedPGN(
        [firstPGN],
        `Game: ${game.white} vs ${game.black}`,
      );
      if (moveTree) {
        setCurrentMoveTree(moveTree);
        setSelectedGame(game);
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Loaded game: ${game.white} vs ${game.black}`,
        });
        setTimeout(() => {
          navigateToMoveByIndex(moveIndex, moveTree);
          setCurrentMoveIndex(moveIndex);
        }, 500);
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Failed to process game: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      console.error("Error processing game:", err);
    }
  };

  const resetToStartingPosition = () => {
    gameRef.current = new Chess();
    setCurrentPosition(startingFEN);
    setCurrentMoveIndex(0);

    // Cache the reset position
    if (selectedGame) {
      cacheGameState(selectedGame.id, 0);
    }

    // Use throttled board update to prevent jumping
    updateBoardPosition(startingFEN);
  };

  const navigateToMove = (targetFen: string, moveIndex?: number) => {
    try {
      //   gameRef.current = new Chess(targetFen);
      setCurrentPosition(targetFen);

      const newMoveIndex = moveIndex !== undefined ? moveIndex : 0;
      setCurrentMoveIndex(newMoveIndex);

      // Cache the current move index
      if (selectedGame) {
        cacheGameState(selectedGame.id, newMoveIndex);
      }

      console.log("Navigating to", targetFen);

      // Use throttled board update to prevent jumping
      updateBoardPosition(targetFen);
    } catch (err) {
      console.error("Error navigating to position:", err);
    }
  };

  const navigateToMoveByIndex = (index: number, moveTree?: MoveTree) => {
    // if (index < -1 || index >= currentMoveTree) return;

    const realMoveTree = moveTree || currentMoveTree;

    if (index === -1) {
      resetToStartingPosition();
    } else {
      let startNode = realMoveTree?.nodes[0];
      let current = startNode?.children[0];
      if (!current) return;

      for (let i = 0; i < index + 1; i++) {
        current = current.children[0];
        if (!current) return;
      }

      navigateToMove(current.fen, index);
    }
  };

  const goToPreviousMove = () => {
    navigateToMoveByIndex(currentMoveIndex - 1);
  };

  const goToNextMove = () => {
    navigateToMoveByIndex(currentMoveIndex + 1);
  };

  const saveNotes = (currentPositionNotes: string) => {
    const newSavedNotes = new Map(savedNotes);
    newSavedNotes.set(currentPosition, currentPositionNotes);
    setSavedNotes(newSavedNotes);

    // Save to localStorage using AnnotationsService
    if (selectedGame?.id) {
      const notesData = Object.fromEntries(newSavedNotes);
      saveGameAnnotations(selectedGame.id, notesData);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPositionNotes(e.target.value);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to auto-save after 1 second of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(e.target.value);
    }, 1000);
  };

  // Load saved notes when a game is selected
  useEffect(() => {
    if (selectedGame) {
      const notesData = getGameAnnotations(selectedGame.id);
      setSavedNotes(new Map(Object.entries(notesData)));
    }
  }, [selectedGame]);

  const dateBodyTemplate = (rowData: GameRow) => {
    return rowData.date;
  };

  const ecoBodyTemplate = (rowData: GameRow) => {
    return rowData.opening;
  };

  const resultBodyTemplate = (rowData: GameRow) => {
    return rowData.result;
  };

  const sourceBodyTemplate = (rowData: GameRow) => {
    return (
      <span
        className={`p-badge ${rowData.source === "lichess" ? "p-badge-success" : "p-badge-info"}`}
      >
        {rowData.source}
      </span>
    );
  };

  const loadButtonTemplate = (rowData: GameRow) => {
    return (
      <Button
        label="Load"
        size="small"
        onClick={() => loadGame(rowData)}
        disabled={loading}
      />
    );
  };

  const rowExpansionTemplate = (data: GameRow) => {
    return (
      <div className="p-3">
        <pre style={{ textOverflow: "wrap" }}>
          {data.pgn.replaceAll("]", "]\n")}
        </pre>
      </div>
    );
  };

  return (
    <div className={`game-annotator ${className}`}>
      <Toast ref={toast} />

      {loading && (
        <div className="text-center my-4">
          <ProgressSpinner />
          <p>Loading games...</p>
        </div>
      )}

      {!currentMoveTree && (
        <Card title="Games" className="h-full w-full">
          <DataTable
            value={games}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={rowExpansionTemplate}
            dataKey="id"
            size="small"
            scrollable
            scrollHeight="450px"
          >
            <Column expander style={{ width: "3em" }} />
            <Column field="date" header="Date" body={dateBodyTemplate} />
            <Column field="name" header="ECO" body={ecoBodyTemplate} />
            <Column field="result" header="Result" body={resultBodyTemplate} />
            <Column field="source" header="Source" body={sourceBodyTemplate} />
            <Column
              field="annotationWordCount"
              header="Annotation Word Count"
            />
            <Column body={loadButtonTemplate} header="Load" />
          </DataTable>
        </Card>
      )}

      {currentMoveTree && (
        <Splitter
          layout={screenHeight > screenWidth ? "vertical" : "horizontal"}
        >
          <SplitterPanel size={50} minSize={10}>
            {currentMoveTree ? (
              <div ref={boardContainerRef} className="h-full w-full">
                <ChessBoard
                  name="game-annotator"
                  game_url={selectedGame?.id || "annotator"}
                  chessboardRef={chessboardRef}
                  size={boardSize}
                  fen={startingFEN}
                  draggable={false}
                />

                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    <Button
                      label="Previous"
                      icon="pi pi-chevron-left"
                      onClick={goToPreviousMove}
                      disabled={currentMoveIndex <= -1}
                      size="small"
                    />
                    <Button
                      label="Next"
                      icon="pi pi-chevron-right"
                      iconPos="right"
                      onClick={goToNextMove}
                      disabled={false}
                      size="small"
                    />
                    <Button
                      label="Start"
                      onClick={resetToStartingPosition}
                      size="small"
                    />
                    {currentMoveIndex}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex align-items-center justify-content-center h-full">
                <p>Load a game to start annotating</p>
              </div>
            )}
          </SplitterPanel>

          <SplitterPanel size={50} minSize={30}>
            {currentMoveTree ? (
              <div className="h-full w-full p-2">
                <div className="flex-1">
                  <InputTextarea
                    value={positionNotes}
                    onChange={handleNotesChange}
                    placeholder="Add notes for this position..."
                    rows={15}
                    className="w-full"
                    onBlur={() => {
                      setIsNotesFocused(false);
                    }}
                    onFocus={() => {
                      setIsNotesFocused(true);
                    }}
                  />
                </div>

                <div className="mt-3">
                  <Button
                    label="Select a New Game"
                    onClick={() => {
                      setCurrentMoveTree(null);
                      setSelectedGame(null);
                      setCurrentMoveIndex(0);
                      setCurrentPosition(startingFEN);
                      cacheGameState(null, 0);
                    }}
                    size="small"
                    className="w-full"
                  />
                </div>

                <div className="text-xs text-500 mt-2">
                  FEN: {currentPosition}
                </div>
              </div>
            ) : (
              <div className="flex align-items-center justify-content-center h-full">
                <p>Notes will appear here</p>
              </div>
            )}
          </SplitterPanel>
        </Splitter>
      )}
    </div>
  );
};

export default GameAnnotator;
