import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Panel } from 'primereact/panel';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { LichessClient, GameJson } from '../integrations/lichess-client';
import OpeningStatisticsTable from './OpeningStatisticsTable';

interface GamesByUserProps {
  initialUsername?: string;
}

const GamesByUser: React.FC<GamesByUserProps> = ({ initialUsername }) => {
  const [username, setUsername] = useState<string>(initialUsername || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [games, setGames] = useState<GameJson[]>([]);
  const lichessClient = new LichessClient();

  const loadGames = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");
    setGames([]);

    try {
      // Calculate timestamp for 3 months ago
      const threeMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
      
      const gameData = await lichessClient.apiGamesUser(username.trim(), {
        since: threeMonthsAgo,
        max: 500, // Limit to 50 games for better performance
        moves: false, // Don't need moves for table display
        opening: true, // Include opening information
        tags: true, // Include PGN tags
        sort: 'dateDesc', // Most recent first
        pgnInJson: true
      });

      // The API returns a single GameJson but it might be an array in practice
      // Let's handle both cases
      const gameArray = Array.isArray(gameData) ? gameData : [gameData];
      setGames(gameArray);
    } catch (err) {
      console.error('Error loading games:', err);
      setError(`Failed to load games: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const playersTemplate = (game: GameJson) => {
    return (
      <div>
        <div style={{ marginBottom: '0.25rem' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
            {game.players.white.user?.name || 'Anonymous'}
          </span>
          <span style={{ color: 'var(--text-color-secondary)', marginLeft: '0.5rem' }}>
            ({game.players.white.rating || '?'})
          </span>
        </div>
        <div>
          <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
            {game.players.black.user?.name || 'Anonymous'}
          </span>
          <span style={{ color: 'var(--text-color-secondary)', marginLeft: '0.5rem' }}>
            ({game.players.black.rating || '?'})
          </span>
        </div>
      </div>
    );
  };

  const resultTemplate = (game: GameJson) => {
    const getResultBadge = (winner?: string) => {
      // Determine if the searched user won
      const whitePlayer = game.players.white.user?.name;
      const blackPlayer = game.players.black.user?.name;
      const searchedUser = username.trim().toLowerCase();
      
      let resultText: string;
      let severity: 'success' | 'danger' | 'info';
      
      if (winner === 'white') {
        resultText = '1-0';
        severity = whitePlayer?.toLowerCase() === searchedUser ? 'success' : 'danger';
      } else if (winner === 'black') {
        resultText = '0-1';
        severity = blackPlayer?.toLowerCase() === searchedUser ? 'success' : 'danger';
      } else {
        resultText = '½-½';
        severity = 'info';
      }
      
      return <Badge value={resultText} severity={severity} />;
    };

    return getResultBadge(game.winner);
  };

  const speedTemplate = (game: GameJson) => {
    return (
      <Badge 
        value={game.speed} 
        severity={game.rated ? 'success' : 'warning'} 
      />
    );
  };

  const openingTemplate = (game: GameJson) => {
    if (!game.opening) return '-';
    
    return (
      <div>
        <div style={{ fontWeight: 'bold' }}>
          {game.opening.name}
        </div>
        <div style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
          {game.opening.eco}
        </div>
      </div>
    );
  };

  const gameIdTemplate = (game: GameJson) => {
    return (
      <a 
        href={`https://lichess.org/${game.id}`} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ textDecoration: 'underline', color: 'var(--primary-color)' }}
      >
        {game.id}
      </a>
    );
  };

  const dateTemplate = (game: GameJson) => {
    return formatDate(game.createdAt);
  };

  const statusTemplate = (game: GameJson) => {
    const statusColors: Record<string, string> = {
      'mate': 'success',
      'resign': 'info', 
      'timeout': 'warning',
      'draw': 'info',
      'stalemate': 'info',
      'aborted': 'danger'
    };

    return (
      <Badge 
        value={game.status} 
        severity={statusColors[game.status] as any || 'secondary'} 
      />
    );
  };



  return (
    <div className="games-by-user" style={{ padding: '1rem' }}>
      <h2>Games by User</h2>
      
      <Panel header="User Games Lookup" className="mb-4">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label htmlFor="username-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Lichess Username:
            </label>
            <InputText
              id="username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter lichess username"
              style={{ width: '100%' }}
              onKeyDown={(e) => e.key === 'Enter' && loadGames()}
            />
          </div>
          <div>
            <Button
              label="Load Games"
              icon={loading ? "pi pi-spin pi-spinner" : "pi pi-download"}
              onClick={loadGames}
              loading={loading}
              disabled={loading || !username.trim()}
              size="large"
              className="p-button-primary"
            />
          </div>
        </div>
        
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-color-secondary)' }}>
          This will load the most recent games from the last 3 months (up to 50 games).
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
          <div style={{ marginTop: '1rem' }}>Loading games for {username}...</div>
        </div>
      )}

      {games.length > 0 && (
        <Panel header={`Games (${games.length})`} className="mb-4">
          <DataTable
            value={games}
            paginator
            rows={10}
            dataKey="id"
            emptyMessage="No games found"
            className="p-datatable-sm"
            sortOrder={-1}
          >
            <Column 
              field="id" 
              header="Game" 
              body={gameIdTemplate}
              style={{ width: '100px' }}
            />
            <Column 
              header="Players" 
              body={playersTemplate}
              style={{ width: '250px' }}
            />
            <Column 
              header="Result" 
              body={resultTemplate}
              style={{ width: '80px', textAlign: 'center' }}
            />
            <Column 
              field="speed" 
              header="Speed" 
              body={speedTemplate}
              style={{ width: '100px' }}
            />
            <Column 
              header="Opening" 
              body={openingTemplate}
              style={{ width: '200px' }}
            />
            <Column 
              header="Status" 
              body={statusTemplate}
              style={{ width: '100px' }}
            />
            <Column 
              field="createdAt" 
              header="Date" 
              body={dateTemplate}
              sortable
              style={{ width: '120px' }}
            />
          </DataTable>
        </Panel>
      )}

      <OpeningStatisticsTable games={games} username={username} />

      {!loading && !error && games.length === 0 && username && (
        <Panel>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-color-secondary)' }}>
            No games found for user "{username}" in the last 3 months.
          </div>
        </Panel>
      )}
    </div>
  );
};

export default GamesByUser;
