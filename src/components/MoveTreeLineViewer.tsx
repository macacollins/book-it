import React, { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { Divider } from "primereact/divider";
import { Chess } from "chess.js";
import ChessBoard from "./ChessBoard";
import {
  calculateMoveTree,
  calculateMoveTreeFromParsedPGN,
} from "../integrations/calculateMoveTree";
import {
  findNodeByFEN,
  MoveTree,
  MoveNode,
  StartNode,
} from "../types/MoveTree";
import pgnParser, { ParsedPGN } from "pgn-parser";
import { TabPanel, TabView } from "primereact/tabview";
import MastersStatistics from "./MastersStatistics";
import LichessStatistics from "./LichessStatistics";

interface MoveTreeLineViewerProps {
  className?: string;
}

const startingFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const MoveTreeLineViewer: React.FC<MoveTreeLineViewerProps> = ({
  className = "",
}) => {
  const [uploadedMoveTree, setUploadedMoveTree] = useState<MoveTree | null>(
    null,
  );
  const [currentPosition, setCurrentPosition] = useState(startingFEN);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<
    Array<{ move: string; fen: string; notes: string }>
  >([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1 for starting position

  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());

  // Keyboard navigation effect
  useEffect(() => {
    if (!uploadedMoveTree) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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
  }, [uploadedMoveTree, currentMoveIndex, moveHistory]);

  const handleFileUpload = (event: any) => {
    const file = event.files[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContents = e.target?.result as string;

      try {
        // Parse the PGN and grab only the first ParsedPGN
        const parsedPGNs: ParsedPGN[] = pgnParser.parse(fileContents);

        if (parsedPGNs.length === 0) {
          setError("No valid PGN found in the file.");
          return;
        }

        // Use only the first parsed PGN
        const firstPGN = parsedPGNs[0];

        // Calculate move tree from the single PGN
        const moveTree = calculateMoveTreeFromParsedPGN(
          [firstPGN],
          "Line Viewer",
        );

        console.log("Calculated move tree from uploaded PGN:", moveTree);

        if (moveTree) {
          setUploadedMoveTree(moveTree);
          resetToStartingPosition();
          setSuccess("PGN loaded successfully!");
          buildMoveHistory(moveTree);
        }
      } catch (err) {
        setError(
          `Failed to process PGN file: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        console.error("Error processing PGN:", err);
      }
    };

    reader.readAsText(file);
  };

  const buildMoveHistory = (moveTree: MoveTree) => {
    const history: Array<{ move: string; fen: string; notes: string }> = [];

    if (moveTree.nodes.length > 0) {
      const startNode = moveTree.nodes[0];

      // Follow the main line (first variation at each point)
      const followMainLine = (children: MoveNode[], moveNum: number = 1) => {
        for (let i = 0; i < children.length; i++) {
          const node = children[i];
          history.push({
            move: node.move,
            fen: node.fen,
            notes: node.notes,
          });

          // Follow the first child (main line)
          if (node.children.length > 0) {
            followMainLine([node.children[0]], moveNum + 1);
            break; // Only follow the main line
          }
        }
      };

      followMainLine(startNode.children);
    }

    setMoveHistory(history);
  };

  const resetToStartingPosition = () => {
    gameRef.current = new Chess();
    setCurrentPosition(startingFEN);
    setCurrentMoveIndex(-1);

    if (chessboardRef.current) {
      chessboardRef.current.position(startingFEN);
    }
  };

  const navigateToMove = (targetFen: string, moveIndex?: number) => {
    try {
      gameRef.current = new Chess(targetFen);
      setCurrentPosition(targetFen);

      if (moveIndex !== undefined) {
        setCurrentMoveIndex(moveIndex);
      } else {
        // Find the move index if not provided
        const index = moveHistory.findIndex((move) => move.fen === targetFen);
        setCurrentMoveIndex(index);
      }

      if (chessboardRef.current) {
        chessboardRef.current.position(targetFen);
      }
    } catch (err) {
      console.error("Error navigating to position:", err);
    }
  };

  const navigateToMoveByIndex = (index: number) => {
    if (index < -1 || index >= moveHistory.length) return;

    if (index === -1) {
      resetToStartingPosition();
    } else {
      const move = moveHistory[index];
      navigateToMove(move.fen, index);
    }
  };

  const goToPreviousMove = () => {
    navigateToMoveByIndex(currentMoveIndex - 1);
  };

  const goToNextMove = () => {
    navigateToMoveByIndex(currentMoveIndex + 1);
  };

  const formatMoveText = () => {
    if (!uploadedMoveTree || moveHistory.length === 0) return null;

    const moves: JSX.Element[] = [];
    let moveNumber = 1;

    // Create the opening line display similar to the screenshot
    if (moveHistory.length > 0) {
      // First, show the main move sequence in the format: "1.d4 Nf6 2.Nc3"
      const moveSequence: JSX.Element[] = [];
      for (let i = 0; i < moveHistory.length; i++) {
        const move = moveHistory[i];
        const isCurrentMove = currentMoveIndex === i;

        if (i % 2 === 0) {
          // White move
          moveSequence.push(
            <span key={`move-${i}`} className="mr-2">
              <span className="font-bold">{Math.floor(i / 2) + 1}.</span>
              <Button
                label={move.move}
                onClick={() => navigateToMove(move.fen, i)}
                className={`ml-1 mr-1 p-button-sm ${isCurrentMove ? "p-button-info" : "p-button-text"}`}
                size="small"
                text={!isCurrentMove}
              />
            </span>,
          );
        } else {
          // Black move
          moveSequence.push(
            <Button
              key={`move-${i}`}
              label={move.move}
              onClick={() => navigateToMove(move.fen, i)}
              className={`mr-2 p-button-sm ${isCurrentMove ? "p-button-info" : "p-button-text"}`}
              size="small"
              text={!isCurrentMove}
            />,
          );
        }
      }

      // Then show individual moves with their specific notes

      let hadNotes = false;
      let currentBuffer = [];
      moveHistory.forEach((move, index) => {
        if (move) {
          const isCurrentMove = currentMoveIndex === index;

          moves.push(
            <>
              {index % 2 === 1 && (
                <span>
                  <Button
                    text={!isCurrentMove}
                    label={`${Math.round(moveNumber / 2)}...${move.move}`}
                    className={`font-bold mb-2 ${isCurrentMove ? "p-button-info" : "text-900"}`}
                    onClick={() => {
                      navigateToMove(move.fen, index);
                    }}
                  />
                </span>
              )}

              {index % 2 === 0 && (
                <Button
                  text={!isCurrentMove}
                  label={`${Math.round(moveNumber / 2)}.${move.move}`}
                  className={`font-bold mb-2 ${isCurrentMove ? "p-button-info" : "text-900"}`}
                  onClick={() => {
                    navigateToMove(move.fen, index);
                  }}
                />
              )}

              {move.notes && (
                <div
                  className="text-600 line-height-3 mb-3 w-full"
                  style={{ minWidth: "100%" }}
                >
                  {move.notes}
                </div>
              )}
            </>,
          );
        }
        moveNumber++;
      });
    }

    return moves;
  };

  return (
    <div className={`move-tree-line-viewer ${className}`}>
      <Card title="PGN Line Viewer" className="mb-4">
        {!uploadedMoveTree && (
          <div className="flex flex-column gap-3">
            <div className="field">
              <label className="block font-bold mb-2">Select PGN File</label>
              <FileUpload
                mode="basic"
                name="pgn-file"
                accept=".pgn,.txt"
                maxFileSize={10000000} // 10MB
                onUpload={handleFileUpload}
                onSelect={handleFileUpload}
                auto
                chooseLabel="Choose PGN File"
                className="w-full"
              />
              <small className="text-500 mt-1 block">
                Only the first game from the PGN will be loaded.
              </small>
            </div>

            {error && (
              <Message severity="error" text={error} className="w-full" />
            )}

            {success && (
              <Message severity="success" text={success} className="w-full" />
            )}
          </div>
        )}

        {uploadedMoveTree && (
          <Splitter>
            <SplitterPanel
              className="flex align-items-center justify-content-center"
              size={50}
            >
              <div className="flex flex-column align-items-center">
                <ChessBoard
                  name="line-viewer"
                  game_url="line-viewer"
                  fen={startingFEN}
                  chessboardRef={chessboardRef}
                  gameRef={gameRef}
                  draggable={false}
                  size="400px"
                />

                <div className="mt-3 text-sm text-500 text-center">
                  Click on moves to navigate or use ← → arrow keys
                </div>
              </div>
            </SplitterPanel>

            <SplitterPanel className="p-3" size={50}>
              <div
                className="max-h-30rem overflow-y-auto"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                }}
              >
                {formatMoveText()}
              </div>
            </SplitterPanel>
          </Splitter>
        )}
      </Card>
    </div>
  );
};

export default MoveTreeLineViewer;
