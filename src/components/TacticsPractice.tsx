import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { UploadedPGNClient } from '../database/UploadedPGNClient';
import { UploadedPGN } from '../database/types';
import pgnParser, { ParsedPGN } from 'pgn-parser';
import ChessBoard from './ChessBoard';

export default () => {
  const [uploadedPGNs, setUploadedPGNs] = useState<UploadedPGN[]>([]);
  const [selectedPGN, setSelectedPGN] = useState<UploadedPGN | null>(null);
  const [parsedPGNs, setParsedPGNs] = useState<ParsedPGN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<any>(null);

  // Load all tactics PGNs from database
  useEffect(() => {
    const loadTacticsPGNs = async () => {
      try {
        setLoading(true);
        const tacticsPGNs = await UploadedPGNClient.getByType('tactics');
        setUploadedPGNs(tacticsPGNs);
      } catch (err) {
        console.error('Error loading tactics PGNs:', err);
        setError('Failed to load tactics from database');
      } finally {
        setLoading(false);
      }
    };

    loadTacticsPGNs();
  }, []);

  // Parse PGN when selection changes
  useEffect(() => {
    if (selectedPGN) {
      try {
        const parsed = pgnParser.parse(selectedPGN.content);
        setParsedPGNs(parsed);
        setError(null);
      } catch (err) {
        console.error('Error parsing PGN:', err);
        setError('Failed to parse selected PGN file');
        setParsedPGNs([]);
      }
    } else {
      setParsedPGNs([]);
    }
  }, [selectedPGN]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  const pgnOptions = uploadedPGNs.map(pgn => ({
    label: pgn.filename,
    value: pgn
  }));

  const firstFEN = parsedPGNs.length > 0 && parsedPGNs[0].headers 
    ? parsedPGNs[0].headers.find(h => h.name === 'FEN')?.value || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const getExpectedMove = (index: number): string | null => {
    if (parsedPGNs.length === 0) return null;

    const game = parsedPGNs[0];
    if (index < 0 || index >= game.moves.length) return null;

    return game.moves[index].move;
  }

  return (
    <div className="p-4">
      <Card title="Tactics Practice">
        <div className="mb-4">
          <label htmlFor="pgn-select" className="block mb-2 font-semibold">
            Select Tactics PGN:
          </label>
          <Dropdown
            id="pgn-select"
            value={selectedPGN}
            options={pgnOptions}
            onChange={(e) => setSelectedPGN(e.value)}
            placeholder="Choose a tactics file..."
            className="w-full"
            disabled={uploadedPGNs.length === 0}
          />
          {uploadedPGNs.length === 0 && (
            <Message 
              severity="info" 
              text="No tactics PGNs found. Upload a tactics PGN file from the Database page." 
              className="mt-2"
            />
          )}
        </div>

        {error && (
          <Message severity="error" text={error} className="mb-4" />
        )}

        {selectedPGN && parsedPGNs.length > 0 && (
          <div className="mt-4">
            <div className="mb-2">
              <strong>Loaded {parsedPGNs.length} puzzle(s)</strong>
            </div>
            <ChessBoard
              name="tactics-practice"
              game_url={selectedPGN.id}
              fen={firstFEN}
              draggable={true}
              chessboardRef={chessboardRef}
              gameRef={gameRef}
              madeMoveRef={{ current: false }}
              moveCallback={(move) => {
                console.log('Move made:', move);

                if (move.san === getExpectedMove(0)) {
                  console.log('Correct move!');
                  return true;
                } else {
                  console.log('Incorrect move.');
                  return false;
                }
              }}
              size="512px"
            />
          </div>
        )}

        {selectedPGN && parsedPGNs.length === 0 && !error && (
          <Message 
            severity="warn" 
            text="No valid puzzles found in the selected PGN file." 
            className="mt-4"
          />
        )}
      </Card>
    </div>
  );
};