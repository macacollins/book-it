import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { UploadedPGNClient } from '../database/UploadedPGNClient';
import { SavedGameClient } from '../database/SavedGameClient';
import { useSlimRepertoire } from '../hooks/useSlimRepertoire';
import { UploadedPGN, SavedGame } from '../database/types';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { TinyFENDisplay } from '../pages/TinyFENDisplay';

interface GameDivergence {
  gameId: string;
  gameTimestamp: number;
  divergenceFen: string;
  movePlayed: string;
  expectedMoves: string[];
}

export const RepertoireDiff = () => {
  const [repertoires, setRepertoires] = useState<UploadedPGN[]>([]);
  const [selectedRepertoire, setSelectedRepertoire] = useState<string | null>(null);
  const [games, setGames] = useState<SavedGame[]>([]);
  const [divergences, setDivergences] = useState<GameDivergence[]>([]);
  const [loading, setLoading] = useState(false);

  const { repertoire, loading: repertoireLoading } = useSlimRepertoire(selectedRepertoire);

  // Load repertoires on mount
  useEffect(() => {
    const loadRepertoires = async () => {
      const allRepertoires = await UploadedPGNClient.getByType('repertoire');
      setRepertoires(allRepertoires);
    };
    loadRepertoires();
  }, []);

  // Load games on mount
  useEffect(() => {
    const loadGames = async () => {
      const allGames = await SavedGameClient.getAll();
      // Get last 50 games by timestamp (most recent first)
      const sortedGames = allGames.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
      setGames(sortedGames);
    };
    loadGames();
  }, []);

  // Analyze games when repertoire is loaded
  useEffect(() => {
    if (!repertoire || !games.length) {
      setDivergences([]);
      return;
    }

    setLoading(true);
    const analyzedDivergences: GameDivergence[] = [];

    for (const game of games) {
      const chess = new Chess();
      
      try {
        chess.loadPgn(game.pgn);
        const history = chess.history({ verbose: true });
        
        // Step through each move
        const chessForAnalysis = new Chess();
        let diverged = false;

        for (const move of history) {
          const currentFen = chessForAnalysis.fen();
          
          // Check if this position is in the repertoire
          if (repertoire[currentFen]) {
            const expectedMoves = repertoire[currentFen];
            const moveSan = move.san;
            
            // Check if the move played is in the expected moves
            if (!expectedMoves.includes(moveSan)) {

              // check for transposition
              let transposed = false;
              try {
                const chess = new Chess(currentFen);
                chess.move(move.san);
                const transposedFen = chess.fen();
                if (repertoire[transposedFen]) {
                  transposed = true;
                }
              } catch (err) {
                console.error('Error checking transposition:', err);
              }
              
              if (!transposed) {
                // This is where the game diverged
                analyzedDivergences.push({
                  gameId: game.id,
                  gameTimestamp: game.timestamp,
                  divergenceFen: currentFen,
                  movePlayed: moveSan,
                  expectedMoves: expectedMoves,
                });
                diverged = true;
                break;
              }
            }
          }
          
          // Make the move to continue
          chessForAnalysis.move(move.san);
        }
      } catch (err) {
        console.error(`Error analyzing game ${game.id}:`, err);
      }
    }

    setDivergences(analyzedDivergences);
    setLoading(false);
  }, [repertoire, games]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const fenBodyTemplate = (rowData: GameDivergence) => {
    return <TinyFENDisplay fen={rowData.divergenceFen} />;
  };

  const expectedMovesBodyTemplate = (rowData: GameDivergence) => {
    return rowData.expectedMoves.join(', ');
  };

  return (
    <div className="p-4">
      <h1>Repertoire Diff Analysis</h1>
      
      <div className="mb-4">
        <label htmlFor="repertoire-select" className="font-semibold block mb-2">
          Select Repertoire
        </label>
        <Dropdown
          id="repertoire-select"
          value={selectedRepertoire}
          options={repertoires.map(r => ({ label: r.filename, value: r.filename }))}
          onChange={(e) => setSelectedRepertoire(e.value)}
          placeholder="Choose a repertoire..."
          className="w-full"
        />
      </div>

      {repertoireLoading && (
        <div className="p-3 mb-4 bg-blue-100 border border-blue-300 text-blue-700 rounded">
          Loading repertoire...
        </div>
      )}

      {loading && (
        <div className="p-3 mb-4 bg-blue-100 border border-blue-300 text-blue-700 rounded">
          Analyzing games...
        </div>
      )}

      {!loading && selectedRepertoire && repertoire && (
        <div>
          <h3>Games Analyzed: {games.length}</h3>
          <h3>Divergences Found: {divergences.length}</h3>

          <DataTable
            value={divergences}
            paginator
            rows={10}
            className="p-datatable-sm mt-3"
            emptyMessage="No divergences found"
          >
            <Column
              field="gameTimestamp"
              header="Date"
              body={(rowData) => formatDate(rowData.gameTimestamp)}
              style={{ width: '15%' }}
            />
            <Column
              field="divergenceFen"
              header="Position"
              body={fenBodyTemplate}
              style={{ width: '30%' }}
            />
            <Column
              field="movePlayed"
              header="Move Played"
              style={{ width: '15%' }}
            />
            <Column
              field="expectedMoves"
              header="Expected Moves"
              body={expectedMovesBodyTemplate}
              style={{ width: '40%' }}
            />
          </DataTable>
        </div>
      )}
    </div>
  );
};