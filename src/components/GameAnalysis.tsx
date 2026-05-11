import React, { useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Message } from "primereact/message";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { LichessClient, GameJson } from "../integrations/lichess-client";
import { Chess } from "chess.js";
import ChessBoard from "./ChessBoard";

interface GameAnalysisProps {
  className?: string;
}

interface MoveListItem {
  moveNumber: number;
  white: string | null;
  black: string | null;
  whiteIndex: number;
  blackIndex: number;
  whiteAnalysis?: {
    eval?: number;
    mate?: number;
    best?: string;
    variation?: string;
    judgment?: {
      name?: "Inaccuracy" | "Mistake" | "Blunder";
      comment?: string;
    };
  };
  blackAnalysis?: {
    eval?: number;
    mate?: number;
    best?: string;
    variation?: string;
    judgment?: {
      name?: "Inaccuracy" | "Mistake" | "Blunder";
      comment?: string;
    };
  };
}

const GameAnalysis: React.FC<GameAnalysisProps> = ({ className = "" }) => {
  const [gameId, setGameId] = useState("");
  const [gameData, setGameData] = useState<GameJson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );
  const [moveList, setMoveList] = useState<MoveListItem[]>([]);
  const [allMoves, setAllMoves] = useState<string[]>([]);

  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());
  const lichessClient = new LichessClient();

  const loadGameData = async () => {
    if (!gameId.trim()) {
      setError("Please enter a game ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch game data with all available options
      const game = await lichessClient.gamePgn(gameId, {
        moves: true,
        pgnInJson: true,
        tags: true,
        clocks: true,
        evals: true,
        accuracy: true,
        opening: true,
        division: true,
        literate: true,
        withBookmarked: true,
      });

      setGameData(game);

      // Parse moves and set up the game
      if (game.moves) {
        const moves = game.moves
          .split(" ")
          .filter((move) => move.trim() !== "");
        setAllMoves(moves);

        // Create move list for display
        const moveListItems: MoveListItem[] = [];
        for (let i = 0; i < moves.length; i += 2) {
          moveListItems.push({
            moveNumber: Math.floor(i / 2) + 1,
            white: moves[i] || null,
            black: moves[i + 1] || null,
            whiteIndex: i,
            blackIndex: i + 1,
            whiteAnalysis:
              game.analysis && game.analysis[i] ? game.analysis[i] : undefined,
            blackAnalysis:
              game.analysis && game.analysis[i + 1]
                ? game.analysis[i + 1]
                : undefined,
          });
        }
        setMoveList(moveListItems);

        // Reset to starting position
        gameRef.current = new Chess(
          game.initialFen ||
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        );
        setCurrentPosition(gameRef.current.fen());
        setCurrentMoveIndex(0);
      }
    } catch (err) {
      setError(
        `Failed to load game: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      console.error("Error loading game:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToMove = (moveIndex: number) => {
    if (!gameData || !gameData.moves) return;

    // Reset game to initial position
    gameRef.current = new Chess(
      gameData.initialFen ||
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );

    // Play moves up to the target index
    for (let i = 0; i < moveIndex; i++) {
      if (i < allMoves.length) {
        try {
          gameRef.current.move(allMoves[i]);
        } catch (err) {
          console.error(`Error making move ${allMoves[i]}:`, err);
          break;
        }
      }
    }

    setCurrentPosition(gameRef.current.fen());
    setCurrentMoveIndex(moveIndex);
  };

  const goToPreviousMove = () => {
    if (currentMoveIndex > 0) {
      navigateToMove(currentMoveIndex - 1);
    }
  };

  const goToNextMove = () => {
    if (currentMoveIndex < allMoves.length) {
      navigateToMove(currentMoveIndex + 1);
    }
  };

  const formatPlayerInfo = (player: any) => {
    if (!player) return "Anonymous";
    const rating = player.rating ? ` (${player.rating})` : "";
    const title = player.title ? `${player.title} ` : "";
    return `${title}${player.user?.name || player.name || "Anonymous"}${rating}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "mate":
        return "success";
      case "resign":
        return "warning";
      case "timeout":
        return "danger";
      case "draw":
        return "info";
      case "stalemate":
        return "info";
      default:
        return "secondary";
    }
  };

  const getJudgmentSeverity = (judgment?: string) => {
    switch (judgment) {
      case "Blunder":
        return "danger";
      case "Mistake":
        return "warning";
      case "Inaccuracy":
        return "info";
      default:
        return "success";
    }
  };

  const formatEvaluation = (analysis?: { eval?: number; mate?: number }) => {
    if (!analysis) return null;
    if (analysis.mate !== undefined) {
      return `M${analysis.mate > 0 ? "+" : ""}${analysis.mate}`;
    }
    if (analysis.eval !== undefined) {
      const eval_score = analysis.eval / 100;
      return eval_score > 0
        ? `+${eval_score.toFixed(1)}`
        : eval_score.toFixed(1);
    }
    return null;
  };

  const moveTemplate = (rowData: MoveListItem) => {
    return (
      <div className="flex flex-column gap-1">
        <div className="flex align-items-center gap-2">
          <span className="font-bold">{rowData.moveNumber}.</span>
          {rowData.white && (
            <div className="flex flex-column gap-1">
              <div className="flex align-items-center gap-1">
                <Button
                  text
                  size="small"
                  className={`p-1 ${currentMoveIndex === rowData.whiteIndex + 1 ? "bg-blue-100" : ""}`}
                  onClick={() => navigateToMove(rowData.whiteIndex + 1)}
                  label={rowData.white}
                />
                {rowData.whiteAnalysis?.judgment && (
                  <Tag
                    value={rowData.whiteAnalysis.judgment.name}
                    severity={getJudgmentSeverity(
                      rowData.whiteAnalysis.judgment.name,
                    )}
                    className="text-xs"
                  />
                )}
              </div>
              {rowData.whiteAnalysis && (
                <div className="flex align-items-center gap-2 text-xs text-500">
                  {formatEvaluation(rowData.whiteAnalysis) && (
                    <span>Eval: {formatEvaluation(rowData.whiteAnalysis)}</span>
                  )}
                  {rowData.whiteAnalysis.best && (
                    <span>Best: {rowData.whiteAnalysis.best}</span>
                  )}
                </div>
              )}
            </div>
          )}
          {rowData.black && (
            <div className="flex flex-column gap-1">
              <div className="flex align-items-center gap-1">
                <Button
                  text
                  size="small"
                  className={`p-1 ${currentMoveIndex === rowData.blackIndex + 1 ? "bg-blue-100" : ""}`}
                  onClick={() => navigateToMove(rowData.blackIndex + 1)}
                  label={rowData.black}
                />
                {rowData.blackAnalysis?.judgment && (
                  <Tag
                    value={rowData.blackAnalysis.judgment.name}
                    severity={getJudgmentSeverity(
                      rowData.blackAnalysis.judgment.name,
                    )}
                    className="text-xs"
                  />
                )}
              </div>
              {rowData.blackAnalysis && (
                <div className="flex align-items-center gap-2 text-xs text-500">
                  {formatEvaluation(rowData.blackAnalysis) && (
                    <span>Eval: {formatEvaluation(rowData.blackAnalysis)}</span>
                  )}
                  {rowData.blackAnalysis.best && (
                    <span>Best: {rowData.blackAnalysis.best}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`game-analysis ${className}`}>
      <Card title="Lichess Game Analysis" className="mb-4">
        <div className="flex gap-2 mb-4">
          <InputText
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter Lichess Game ID (e.g. 5IrD6Gzz)"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && loadGameData()}
          />
          <Button
            label="Load Game"
            icon="pi pi-search"
            onClick={loadGameData}
            loading={loading}
            disabled={!gameId.trim()}
          />
        </div>

        {error && <Message severity="error" text={error} className="mb-4" />}

        {gameData && (
          <div className="grid">
            <div className="col-12 lg:col-8">
              <Card title="Game Board" className="mb-4">
                <div className="flex justify-content-between align-items-center mb-3">
                  <Button
                    icon="pi pi-chevron-left"
                    onClick={goToPreviousMove}
                    disabled={currentMoveIndex === 0}
                    tooltip="Previous move"
                  />
                  <span className="font-bold">
                    Move {currentMoveIndex} of {allMoves.length}
                    {currentMoveIndex > 0 &&
                      allMoves[currentMoveIndex - 1] &&
                      ` - ${allMoves[currentMoveIndex - 1]}`}
                  </span>
                  <Button
                    icon="pi pi-chevron-right"
                    onClick={goToNextMove}
                    disabled={currentMoveIndex >= allMoves.length}
                    tooltip="Next move"
                  />
                </div>

                <ChessBoard
                  name="lichess-analysis"
                  game_url={`https://lichess.org/${gameData.id}`}
                  fen={currentPosition}
                  chessboardRef={chessboardRef}
                  gameRef={gameRef}
                  draggable={false}
                  size="400px"
                />
              </Card>

              <Card title="Game Information">
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <h6>Players</h6>
                    <div className="mb-2">
                      <strong>White:</strong>{" "}
                      {formatPlayerInfo(gameData.players.white)}
                    </div>
                    <div className="mb-2">
                      <strong>Black:</strong>{" "}
                      {formatPlayerInfo(gameData.players.black)}
                    </div>
                    {gameData.winner && (
                      <div className="mb-2">
                        <strong>Winner:</strong>
                        <Tag
                          value={gameData.winner}
                          severity={
                            gameData.winner === "white" ? "info" : "secondary"
                          }
                          className="ml-1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-12 md:col-6">
                    <h6>Game Details</h6>
                    <div className="mb-2">
                      <strong>Status:</strong>
                      <Tag
                        value={gameData.status}
                        severity={getStatusColor(gameData.status)}
                        className="ml-1"
                      />
                    </div>
                    <div className="mb-2">
                      <strong>Variant:</strong> {gameData.variant}
                    </div>
                    <div className="mb-2">
                      <strong>Speed:</strong> {gameData.speed}
                    </div>
                    <div className="mb-2">
                      <strong>Rated:</strong> {gameData.rated ? "Yes" : "No"}
                    </div>
                  </div>

                  <div className="col-12">
                    <Divider />
                    <h6>Timestamps</h6>
                    <div className="grid">
                      <div className="col-12 md:col-6">
                        <strong>Started:</strong>{" "}
                        {formatTime(gameData.createdAt)}
                      </div>
                      <div className="col-12 md:col-6">
                        <strong>Last Move:</strong>{" "}
                        {formatTime(gameData.lastMoveAt)}
                      </div>
                    </div>
                  </div>

                  {gameData.opening && (
                    <div className="col-12">
                      <Divider />
                      <h6>Opening</h6>
                      <div className="mb-2">
                        <strong>Name:</strong> {gameData.opening.name}
                      </div>
                      {gameData.opening.eco && (
                        <div className="mb-2">
                          <strong>ECO:</strong> {gameData.opening.eco}
                        </div>
                      )}
                    </div>
                  )}

                  {gameData.clock && (
                    <div className="col-12">
                      <Divider />
                      <h6>Time Control</h6>
                      <div className="mb-2">
                        <strong>Initial:</strong>{" "}
                        {Math.floor(gameData.clock.initial / 60)}:
                        {(gameData.clock.initial % 60)
                          .toString()
                          .padStart(2, "0")}
                      </div>
                      <div className="mb-2">
                        <strong>Increment:</strong> {gameData.clock.increment}s
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="col-12 lg:col-4">
              <Panel header="Move List" className="h-full">
                <DataTable
                  value={moveList}
                  scrollable
                  scrollHeight="400px"
                  showGridlines
                  size="small"
                  expandedRows={undefined}
                >
                  <Column body={moveTemplate} header="Moves" />
                </DataTable>

                {gameData.analysis && (
                  <div className="mt-3 text-sm text-500">
                    <strong>Analysis Legend:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Tag
                        value="Blunder"
                        severity="danger"
                        className="text-xs"
                      />
                      <Tag
                        value="Mistake"
                        severity="warning"
                        className="text-xs"
                      />
                      <Tag
                        value="Inaccuracy"
                        severity="info"
                        className="text-xs"
                      />
                      <span className="text-xs">
                        Eval: position evaluation in pawns
                      </span>
                      <span className="text-xs">M#: mate in # moves</span>
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GameAnalysis;
