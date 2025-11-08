import React, { useState } from 'react';
import FENChooser from './FENChooser';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Panel } from 'primereact/panel';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { LichessClient, OpeningExplorerMasters } from '../integrations/lichess-client';

interface GamesFromFENProps {
  initialFEN?: string;
}

const GamesFromFEN: React.FC<GamesFromFENProps> = ({ initialFEN }) => {
  const [currentFEN, setCurrentFEN] = useState<string>(
    initialFEN || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [masterData, setMasterData] = useState<OpeningExplorerMasters | null>(null);

  const lichessClient = new LichessClient();

  const handleFENChange = (fen: string) => {
    setCurrentFEN(fen);
    // Clear previous data when FEN changes
    setMasterData(null);
    setError("");
  };

  const loadLichessData = async () => {
    setLoading(true);
    setError("");
    setMasterData(null);

    try {
      const data = await lichessClient.openingExplorerMaster({
        fen: currentFEN,
        topGames: 20, // Request top 20 games
        moves: 15   // Request up to 15 moves
      });

      setMasterData(data);
    } catch (err) {
      console.error('Error loading Lichess data:', err);
      setError(`Failed to load data from Lichess: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const playerTemplate = (game: any) => {
    return (
      <div>
        <div>
          <strong>{game.white.name}</strong> ({game.white.rating})
        </div>
        <div>
          <strong>{game.black.name}</strong> ({game.black.rating})
        </div>
      </div>
    );
  };

  const resultTemplate = (game: any) => {
    const getResultBadge = (winner: string) => {
      switch (winner) {
        case 'white':
          return <Badge value="1-0" severity="success" />;
        case 'black':
          return <Badge value="0-1" severity="danger" />;
        default:
          return <Badge value="½-½" severity="info" />;
      }
    };

    return getResultBadge(game.winner);
  };

  const yearTemplate = (game: any) => {
    return game.year + (game.month ? `/${game.month}` : '');
  };

  const gameIdTemplate = (game: any) => {
    return (
      <a 
        href={`https://lichess.org/game/export/${game.id}`} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ textDecoration: 'underline', color: 'var(--primary-color)' }}
      >
        {game.id}
      </a>
    );
  };

  const moveTemplate = (move: any) => {
    return (
      <div style={{ padding: '0.5rem' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
          {move.san}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-color-secondary)' }}>
          White: {move.white}, Draws: {move.draws}, Black: {move.black}
        </div>
      </div>
    );
  };

  return (
    <div className="games-from-fen" style={{ padding: '1rem' }}>
      <h2>Games from FEN Position</h2>
      
      <Panel header="Position Setup" className="mb-4">
        <FENChooser
          initialFEN={currentFEN}
          onFENChange={handleFENChange}
        />
        
        <Divider />
        
        <div style={{ textAlign: 'center' }}>
          <Button
            label="Load Lichess Data"
            icon={loading ? "pi pi-spin pi-spinner" : "pi pi-download"}
            onClick={loadLichessData}
            loading={loading}
            disabled={loading}
            size="large"
            className="p-button-success"
          />
        </div>
      </Panel>

      {error && (
        <Message 
          severity="error" 
          text={error} 
          style={{ width: '100%', marginBottom: '1rem' }} 
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <ProgressSpinner />
          <div style={{ marginTop: '1rem' }}>Loading master games data...</div>
        </div>
      )}

      {masterData && (
        <div>
          {/* Opening Information */}
          {masterData.opening && (
            <Panel header="Opening Information" className="mb-4">
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {masterData.opening.name}
              </div>
              <div style={{ color: 'var(--text-color-secondary)' }}>
                ECO Code: {masterData.opening.eco}
              </div>
            </Panel>
          )}

          {/* Statistics */}
          <Panel header="Position Statistics" className="mb-4">
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--green-500)' }}>
                  {masterData.white}
                </div>
                <div>White Wins</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--blue-500)' }}>
                  {masterData.draws}
                </div>
                <div>Draws</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--red-500)' }}>
                  {masterData.black}
                </div>
                <div>Black Wins</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {masterData.white + masterData.draws + masterData.black}
                </div>
                <div>Total Games</div>
              </div>
            </div>
          </Panel>

          {/* Popular Moves */}
          {masterData.moves && masterData.moves.length > 0 && (
            <Panel header={`Popular Moves (${masterData.moves.length})`} className="mb-4">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {masterData.moves.slice(0, 12).map((move: any, index: number) => (
                  <div key={index} className="border-1 surface-border border-round p-3">
                    {moveTemplate(move)}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Top Games */}
          {masterData.topGames && masterData.topGames.length > 0 && (
            <Panel header={`Master Games (${masterData.topGames.length})`} className="mb-4">
              <DataTable
                value={masterData.topGames}
                paginator
                rows={10}
                dataKey="id"
                emptyMessage="No games found"
                className="p-datatable-sm"
                stripedRows={false}
              >
                <Column 
                  field="id" 
                  header="Game ID" 
                  body={gameIdTemplate}
                  style={{ width: '120px' }}
                />
                <Column 
                  header="Players" 
                  body={playerTemplate}
                  style={{ width: '300px' }}
                />
                <Column 
                  header="Result" 
                  body={resultTemplate}
                  style={{ width: '80px', textAlign: 'center' }}
                />
                <Column 
                  field="year" 
                  header="Date" 
                  body={yearTemplate}
                  style={{ width: '100px' }}
                />
              </DataTable>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
};

export default GamesFromFEN;
