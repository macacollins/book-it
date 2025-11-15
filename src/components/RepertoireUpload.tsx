import React, { useState, useRef, useEffect } from 'react';
import { Card } from 'primereact/card';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Panel } from 'primereact/panel';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { Tree } from 'primereact/tree';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import processNewRepertoire from '../integrations/processNewRepertoire';
import Repertoire from '../types/Repertoire';
import { calculateRepertoire } from '../integrations/calculateRepertoire';
import { calculateMoveTree } from '../integrations/calculateMoveTree';
import { findNodeByFEN, MoveTree, MoveNode, StartNode } from '../types/MoveTree';

interface RepertoireUploadProps {
  className?: string;
  repertoire: { [name: string]: Repertoire };
  setRepertoire: (newValue: { [name: string]: Repertoire }) => void;
  repertoireList: string[];
  setRepertoireList: (newValue: string[]) => void;
}

const startingFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const RepertoireUpload: React.FC<RepertoireUploadProps> = ({
}) => {
  const [newRepertoireNameField, setNewRepertoireNameField] = useState('test');
  const [uploadedRepertoire, setUploadedRepertoire] = useState<MoveTree | null>(null);
  const [currentPosition, setCurrentPosition] = useState(startingFEN);
  const [availableMoves, setAvailableMoves] = useState<string[]>([]);
  const [currentNotes, setCurrentNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<any[]>([]);
  
  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());

  // Force tree re-render when position changes to update current position indicator
  useEffect(() => {
    if (uploadedRepertoire) {
      const treeDataConverted = convertMoveTreeToTreeData(uploadedRepertoire);
      setTreeData(treeDataConverted);
    }
  }, [currentPosition, uploadedRepertoire]);

  // Convert MoveTree to PrimeReact Tree format
  const convertMoveTreeToTreeData = (moveTree: MoveTree) => {
    const convertMoveNode = (moveNode: MoveNode, parentKey: string = ''): any => {
      const key = parentKey ? `${parentKey}-${moveNode.move}` : moveNode.move;
      return {
        key,
        label: moveNode.move,
        data: {
          move: moveNode.move,
          fen: moveNode.fen,
          type: 'move'
        },
        children: moveNode.children.map((child, index) => 
          convertMoveNode(child, key)
        )
      };
    };

    const convertStartNode = (startNode: StartNode, index: number): any => {
      const key = `start-${index}`;
      return {
        key,
        label: startNode.notes || `Position ${index + 1}`,
        data: {
          fen: startNode.startingFEN,
          notes: startNode.notes,
          type: 'start'
        },
        children: startNode.children.map((child, childIndex) => 
          convertMoveNode(child, key)
        )
      };
    };

    return moveTree.nodes.map((startNode, index) => convertStartNode(startNode, index));
  };

  const handleFileUpload = (event: any) => {
    const file = event.files[0];
    if (!file) return;

    if (!newRepertoireNameField.trim()) {
      setError('Please enter a repertoire name before uploading.');
      return;
    }

    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContents = e.target?.result as string;
      
      try {

        const repertoire = calculateMoveTree(fileContents, newRepertoireNameField);

        // Get the newly created repertoire
        if (repertoire) {
          setUploadedRepertoire(repertoire);
          // Convert to tree data for visualization
          const treeDataConverted = convertMoveTreeToTreeData(repertoire);
          setTreeData(treeDataConverted);
          // Reset to starting position
          resetToStartingPosition();
          setSuccess(`Repertoire "${newRepertoireNameField}" uploaded successfully!`);
          updateAvailableMoves(startingFEN);
        }
      } catch (err) {
        setError(`Failed to process repertoire file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Error processing repertoire:', err);
      }
    };

    reader.readAsText(file);
  };

  const resetToStartingPosition = () => {
    const startingFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    gameRef.current = new Chess();
    setCurrentPosition(startingFEN);
    
    if (chessboardRef.current) {
      chessboardRef.current.position(startingFEN);
    }
    
    updateAvailableMoves(startingFEN);
  };

  const updateAvailableMoves = (fen: string) => {
    if (!uploadedRepertoire) {
      setAvailableMoves([]);
      setCurrentNotes("");
      return;
    }

    // Look up moves available from this position in the repertoire
    const nodeResult = findNodeByFEN(uploadedRepertoire, fen);
    
    if (nodeResult) {
      const moves = nodeResult.node.children.map(child => child.move);
      setAvailableMoves(moves);
      setCurrentNotes(nodeResult.node.notes);
    } else {
      setAvailableMoves([]);
      setCurrentNotes("");
    }
  };

  const makeMove = (move: string) => {
    try {
      // Make the move on the chess game
      gameRef.current.move(move);
      const newFEN = gameRef.current.fen();
      
      // Update the board position
      setCurrentPosition(newFEN);
      if (chessboardRef.current) {
        chessboardRef.current.position(newFEN);
      }
      
      // Update available moves for the new position
      updateAvailableMoves(newFEN);
      
    } catch (err) {
      setError(`Invalid move: ${move}`);
      console.error('Error making move:', err);
    }
  };

  const goBack = () => {
    if (gameRef.current.history().length > 0) {
      gameRef.current.undo();
      const newFEN = gameRef.current.fen();
      
      setCurrentPosition(newFEN);
      if (chessboardRef.current) {
        chessboardRef.current.position(newFEN);
      }
      
      updateAvailableMoves(newFEN);
    }
  };

  const updateCurrentNotes = (newNotes: string) => {
    if (!uploadedRepertoire) return;

    // Find the current node and update its notes
    const nodeResult = findNodeByFEN(uploadedRepertoire, currentPosition);
    if (nodeResult) {
      // Update the notes in the node
      nodeResult.node.notes = newNotes;
      setCurrentNotes(newNotes);
      
      // Trigger tree re-render to reflect changes
      const treeDataConverted = convertMoveTreeToTreeData(uploadedRepertoire);
      setTreeData(treeDataConverted);
    }
  };

  const formatMoveButton = (move: string, index: number) => {
    return (
      <Button
        key={index}
        label={move}
        onClick={() => makeMove(move)}
        className="mr-2 mb-2"
        size="small"
        outlined
      />
    );
  };

  const nodeTemplate = (node: any) => {
    const isCurrentPosition = node.data?.fen === currentPosition;
    return (
      <div className={`flex align-items-center gap-2 ${isCurrentPosition ? 'bg-blue-100 p-1 border-round' : ''}`}>
        <span className={`${node.data?.type === 'start' ? 'font-bold text-primary' : ''}`}>
          {node.label}
        </span>
        {node.data?.type === 'move' && (
          <small className="text-500">
            ({node.children?.length || 0} variations)
          </small>
        )}
        {isCurrentPosition && (
          <i className="pi pi-map-marker text-blue-500" title="Current position"></i>
        )}
      </div>
    );
  };

  return (
    <div className={`repertoire-upload`}>
      <Card title="Repertoire Upload & Explorer" className="mb-4">
        <div className="grid">
          <div className="col-12 lg:col-6">
            <Panel header="Upload Repertoire" className="mb-4">
              <div className="flex flex-column gap-3">
                <div className="field">
                  <label htmlFor="repertoire-name" className="block font-bold mb-2">
                    Repertoire Name
                  </label>
                  <InputText
                    id="repertoire-name"
                    value={newRepertoireNameField}
                    onChange={(e) => setNewRepertoireNameField(e.target.value)}
                    placeholder="Enter repertoire name"
                    className="w-full"
                  />
                </div>

                <div className="field">
                  <label className="block font-bold mb-2">
                    Select Repertoire File
                  </label>
                  <FileUpload
                    mode="basic"
                    name="repertoire-file"
                    accept=".pgn,.txt"
                    maxFileSize={10000000} // 10MB
                    onUpload={handleFileUpload}
                    onSelect={handleFileUpload}
                    auto
                    chooseLabel="Choose Repertoire File"
                    className="w-full"
                    disabled={!newRepertoireNameField.trim()}
                  />
                </div>

                {error && (
                  <Message severity="error" text={error} className="w-full" />
                )}

                {success && (
                  <Message severity="success" text={success} className="w-full" />
                )}
              </div>
            </Panel>

            {uploadedRepertoire && (
              <Panel header="Navigation Controls" className="mb-4">
                <div className="flex gap-2 align-items-center">
                  <Button
                    icon="pi pi-arrow-left"
                    label="Back"
                    onClick={goBack}
                    disabled={gameRef.current?.history().length === 0}
                    size="small"
                  />
                  <Button
                    icon="pi pi-refresh"
                    label="Reset"
                    onClick={resetToStartingPosition}
                    severity="secondary"
                    size="small"
                  />
                </div>
              </Panel>
            )}
          </div>

          <div className="col-12 lg:col-6">
            {uploadedRepertoire && (
              <Card title="Chess Position" className="mb-4">
                <div className="flex flex-column align-items-center">
                  <ChessBoard
                    name="repertoire-explorer"
                    game_url="repertoire-upload"
                    fen={currentPosition}
                    chessboardRef={chessboardRef}
                    gameRef={gameRef}
                    draggable={false}
                    size="400px"
                  />
                  
                  <div className="mt-3 text-sm text-500">
                    <strong>Current Position:</strong> {gameRef.current?.history().length || 0} moves played
                  </div>
                </div>
              </Card>
            )}
          </div>

          {uploadedRepertoire && (
            <div className="col-12">
              <Divider />
              <Panel header="Available Moves" className="mt-4">
                {availableMoves.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableMoves.map((move, index) => formatMoveButton(move, index))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="pi pi-info-circle mr-2"></i>
                    No moves available in repertoire from this position.
                    {gameRef.current?.history().length > 0 && (
                      <div className="mt-2">
                        <Button 
                          label="Go back to find repertoire moves" 
                          onClick={goBack}
                          text
                          size="small"
                        />
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {uploadedRepertoire && (
            <div className="col-12">
              <Divider />
              <Panel header="Position Notes" className="mt-4">
                <div className="field">
                  <label htmlFor="position-notes" className="block font-bold mb-2">
                    Notes for current position:
                  </label>
                  <InputTextarea
                    id="position-notes"
                    value={currentNotes}
                    onChange={(e) => updateCurrentNotes(e.target.value)}
                    placeholder="Add notes about this position, moves, or strategy..."
                    rows={4}
                    className="w-full"
                    autoResize
                  />
                  <small className="text-500 mt-1 block">
                    Notes are automatically saved as you type and associated with the current position.
                  </small>
                </div>
              </Panel>
            </div>
          )}

          {uploadedRepertoire && (
            <div className="col-12">
              <Divider />
              <Panel header="Repertoire Structure" className="mt-4">
                <div className="mb-3 text-sm text-600">
                  <strong>Repertoire Name:</strong> {uploadedRepertoire.name}
                  <br />
                  <strong>Total Positions:</strong> {uploadedRepertoire.nodes.length}
                </div>
                <Tree
                  value={treeData}
                  className="w-full"
                  selectionMode="single"
                  nodeTemplate={nodeTemplate}
                  onNodeClick={(e) => {
                    const nodeData = e.node.data;
                    if (nodeData && nodeData.fen) {
                      // Navigate to the selected position
                      try {
                        gameRef.current = new Chess(nodeData.fen);
                        setCurrentPosition(nodeData.fen);
                        if (chessboardRef.current) {
                          chessboardRef.current.position(nodeData.fen);
                        }
                        updateAvailableMoves(nodeData.fen);
                      } catch (err) {
                        console.error('Error navigating to position:', err);
                      }
                    }
                  }}
                />
              </Panel>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RepertoireUpload;