import React, { useState, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import ChessBoard from './ChessBoard';

export interface FENChooserProps {
  initialFEN?: string;
  onFENChange?: (fen: string) => void;
}

const FENChooser: React.FC<FENChooserProps> = ({
  initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  onFENChange
}) => {
  const [currentFEN, setCurrentFEN] = useState<string>(initialFEN);
  const [inputFEN, setInputFEN] = useState<string>(initialFEN);
  const [error, setError] = useState<string>("");
  
  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());

  const handleMoveCallback = (move: Move) => {

    //gameRef.current.move(move.san)

    // Update the FEN after a move is made
    const newFEN = gameRef.current.fen();
    setCurrentFEN(newFEN);
    setInputFEN(newFEN);
    setError("");
    
    if (onFENChange) {
      onFENChange(newFEN);
    }
  };

  const handleLoadFEN = () => {
    try {
      // Validate the FEN by creating a new Chess instance
      const testChess = new Chess(inputFEN);
      
      // If we get here, the FEN is valid
      setCurrentFEN(inputFEN);
      setError("");
      
      // Update the game reference
      gameRef.current = new Chess(inputFEN);
      
      // Update the chessboard position
      if (chessboardRef.current) {
        chessboardRef.current.position(inputFEN);
      }
      
      if (onFENChange) {
        onFENChange(inputFEN);
      }
    } catch (e) {
      setError("Invalid FEN notation. Please check your input.");
    }
  };

  const handleFENInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputFEN(e.target.value);
    setError("");
  };

  const resetToStartingPosition = () => {
    const startingFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    setCurrentFEN(startingFEN);
    setInputFEN(startingFEN);
    setError("");
    
    gameRef.current = new Chess();
    
    if (chessboardRef.current) {
      chessboardRef.current.position(startingFEN);
    }
    
    if (onFENChange) {
      onFENChange(startingFEN);
    }
  };

  return (
    <div className="fen-chooser" style={{ padding: '1rem' }}>      
      <div style={{ marginBottom: '1rem' }}>
        <ChessBoard
          name="fen-chooser"
          game_url="fen-editor"
          fen={currentFEN}
          draggable={true}
          madeMoveRef={{ current: false }}
          moveCallback={handleMoveCallback}
          chessboardRef={chessboardRef}
          gameRef={gameRef}
          size="400px"
        />
      </div>

      <div className="fen-input-section" style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="fen-input" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
            FEN Position:
          </label>
          <InputText
            id="fen-input"
            value={inputFEN}
            onChange={handleFENInputChange}
            placeholder="Enter FEN notation"
            style={{ width: '100%', fontFamily: 'monospace' }}
          />
        </div>

        {error && (
          <Message 
            severity="error" 
            text={error} 
            style={{ marginBottom: '0.5rem', display: 'block' }} 
          />
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <Button
            label="Load FEN"
            onClick={handleLoadFEN}
            severity="success"
            size="small"
          />
          <Button
            label="Reset to Starting Position"
            onClick={resetToStartingPosition}
            severity="secondary"
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default FENChooser;