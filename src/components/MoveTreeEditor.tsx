import React, { useState, useRef, useEffect } from 'react';
import { Chess, Move } from 'chess.js';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import ChessBoard from './ChessBoard';
import { TinyFENDisplay } from '../pages/TinyFENDisplay';
import useWindowSize from '../hooks/useWindowSize';
import { 
  MoveTree, 
  createMoveTree, 
  addStartNode, 
  addMoveNode, 
  findNodeByFEN,
  MoveNode,
  StartNode
} from '../types/MoveTree';
import { PositionNotesClient } from '../database/PositionNotesClient';

interface MoveTreeEditorProps {
  initialMoveTree?: MoveTree;
  onMoveTreeChange?: (moveTree: MoveTree) => void;
}

const startingFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const MoveTreeEditor: React.FC<MoveTreeEditorProps> = ({
  initialMoveTree,
  onMoveTreeChange
}) => {
  const [moveTree, setMoveTree] = useState<MoveTree>(() => {
    if (initialMoveTree) {
      return initialMoveTree;
    }
    const tree = createMoveTree('New Move Tree');
    return addStartNode(tree, startingFEN, '');
  });
  
  const [currentFEN, setCurrentFEN] = useState<string>(startingFEN);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [childMoves, setChildMoves] = useState<MoveNode[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  
  const [windowWidth, windowHeight] = useWindowSize();
  
  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate board size as minimum of window dimensions and 400px
  const boardSize = `${Math.min(windowWidth, windowHeight, 400)}px`;

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Update child moves and notes whenever current position changes
  useEffect(() => {
    // Clear any pending debounced note updates when position changes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }


    // Load notes from database
    const loadNotes = async () => {
      try {
        const positionNotes = await PositionNotesClient.getByFEN(currentFEN);
        setNotes(positionNotes?.notes || '');
      } catch (error) {
        console.error('Error loading notes from database:', error);
        setNotes('');
      }
    };
    
    const nodeResult = findNodeByFEN(moveTree, currentFEN);
    
    if (nodeResult) {
      if (nodeResult.type === 'start') {
        const startNode = nodeResult.node as StartNode;
        setChildMoves(startNode.children);
        loadNotes()
      } else {
        const moveNode = nodeResult.node as MoveNode;
        setChildMoves(moveNode.children);
      }
    } else {
      setChildMoves([]);
    }


    loadNotes();
  }, [currentFEN, moveTree]);

  // Notify parent of changes
  useEffect(() => {
    if (onMoveTreeChange) {
      onMoveTreeChange(moveTree);
    }
  }, [moveTree, onMoveTreeChange]);

  const handleMove = (move: Move): boolean => {
    if (!move) return false;

    try {
      // Get the current position
      const beforeFEN = move.before
      
      // Make the move in the game reference
      // gameRef.current.move(move);
      const afterFEN = move.after;
      
      // Add the move to the move tree
      const updatedTree = addMoveNode(
        moveTree,
        beforeFEN,
        move.san,
        afterFEN,
        ''
      );
      
      setMoveTree(updatedTree);
      setCurrentFEN(afterFEN);
      setMoveHistory([...moveHistory, move.san]);
      
      return true;
    } catch (error) {
      console.error('Error handling move:', error);
      return false;
    }
  };

  const handleChildMoveClick = (childNode: MoveNode) => {
    try {
      // Load the position
      gameRef.current = new Chess(childNode.fen);
      setCurrentFEN(childNode.fen);
      
      // Update move history by finding the path from start to this node
      const newHistory = [...moveHistory, childNode.move];
      setMoveHistory(newHistory);
      
      // Update the chessboard
      if (chessboardRef.current) {
        chessboardRef.current.position(childNode.fen);
      }
      
      // Notes will be loaded by the useEffect when currentFEN changes
    } catch (error) {
      console.error('Error navigating to child move:', error);
    }
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    
    // Clear existing timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timeout to save notes to database after 500ms of inactivity
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Check if position notes already exist
        const existingNotes = await PositionNotesClient.getByFEN(currentFEN);
        
        if (existingNotes) {
          // Update existing notes
          await PositionNotesClient.updateNotes(currentFEN, newNotes);
        } else {
          // Insert new position notes
          await PositionNotesClient.insert({
            fen: currentFEN,
            notes: newNotes,
            source: 'move-tree-editor',
            status: 'not-synced'
          });
        }
      } catch (error) {
        console.error('Error saving notes to database:', error);
      }
    }, 500);
  };

  const handleReset = () => {
    gameRef.current = new Chess();
    setCurrentFEN(startingFEN);
    setMoveHistory([]);
    
    if (chessboardRef.current) {
      chessboardRef.current.position(startingFEN);
    }
  };

  const handleBack = () => {
    if (moveHistory.length === 0) return;
    
    // Rebuild the game up to the previous move
    const newHistory = moveHistory.slice(0, -1);
    const newGame = new Chess();
    
    for (const moveStr of newHistory) {
      newGame.move(moveStr);
    }
    
    gameRef.current = newGame;
    const newFEN = newGame.fen();
    setCurrentFEN(newFEN);
    setMoveHistory(newHistory);
    
    if (chessboardRef.current) {
      chessboardRef.current.position(newFEN);
    }
  };

  return (
    <div className="move-tree-editor" style={{ padding: '1rem' }}>
      <Card title="Move Tree Editor">
        <Splitter layout={windowHeight > windowWidth ? 'vertical' : 'horizontal'}>
          
          <SplitterPanel size={50} minSize={10}>
            <div className="h-full w-full">
              {/* Chess Board */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {isExpanded ? (
                  <ChessBoard
                    name="move-tree-editor"
                    game_url=""
                    fen={currentFEN}
                    draggable={true}
                    moveCallback={handleMove}
                    madeMoveRef={{ current: false }}
                    chessboardRef={chessboardRef}
                    gameRef={gameRef}
                    size={boardSize}
                  />
                ) : (
                  <TinyFENDisplay fen={currentFEN} />
                )}
              </div>

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                <Button 
                  label="Reset" 
                  icon="pi pi-refresh" 
                  onClick={handleReset}
                  severity="secondary"
                />
                <Button 
                  label="Back" 
                  icon="pi pi-arrow-left" 
                  onClick={handleBack}
                  disabled={moveHistory.length === 0}
                  severity="secondary"
                />
                <Button 
                  label={isExpanded ? "Shrink" : "Expand"}
                  icon={isExpanded ? "pi pi-minus" : "pi pi-plus"}
                  onClick={() => setIsExpanded(!isExpanded)}
                  severity="secondary"
                />
              </div>

              {/* Child Moves */}
              {childMoves.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Variations from this position:</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {childMoves.map((child, index) => (
                      <Button
                        key={index}
                        label={child.move}
                        onClick={() => handleChildMoveClick(child)}
                        severity="info"
                        outlined
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SplitterPanel>

          <SplitterPanel size={50} minSize={30}>
            <div className="h-full w-full p-2">
              {/* Notes Editor */}
              <div>
                <InputTextarea
                  id="notes"
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  rows={15}
                  className="w-full"
                  placeholder="Add notes about this position..."
                />
              </div>

              {isExpanded && (
                <div className="text-xs text-500 mt-2">
                  <strong>FEN:</strong> {currentFEN}
                </div>
              )}
            </div>
          </SplitterPanel>

        </Splitter>
      </Card>
    </div>
  );
};