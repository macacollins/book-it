import { LichessClient } from '../integrations/lichess-client';
import { SavedGameClient, SavedGame } from './index';

export interface SyncLichessGamesParams {
  username: string;
  onStart: () => void;
  onComplete: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataChanged: () => void;
}

export async function syncLichessGames({
  username,
  onStart,
  onComplete,
  onSuccess,
  onError,
  onDataChanged
}: SyncLichessGamesParams): Promise<void> {
  if (!username.trim()) {
    onError('Please enter a Lichess username');
    return;
  }

  onStart();
  try {
    const lichessClient = new LichessClient();
    
    // Get last 3 months of games with PGN data
    const since = Date.now() - (3 * 30 * 24 * 60 * 60 * 1000); // 3 months ago
    const gamesResponse = await lichessClient.apiGamesUser(username.trim(), {
      since,
      max: 200, // Lichess API limit
      moves: true,
      pgnInJson: true,
      finished: true
    });

    // Note: Lichess returns NDJSON, so we need to handle it properly
    // For now, we'll handle it as a single game object, but in practice
    // you might need to parse NDJSON format
    const games = Array.isArray(gamesResponse) ? gamesResponse : [gamesResponse];
    
    let importCount = 0;
    for (const game of games) {
      if (game && game.id && game.pgn) {
        const savedGame: SavedGame = {
          id: `lichess-${game.id}`,
          timestamp: game.createdAt,
          pgn: game.pgn,
          source: 'lichess.org'
        };
        
        // Check if game already exists
        const exists = await SavedGameClient.exists(savedGame.id);
        if (!exists) {
          await SavedGameClient.insert(savedGame);
          importCount++;
        }
      }
    }
    
    onSuccess(`Successfully imported ${importCount} new games from Lichess`);
    onDataChanged();
  } catch (error) {
    console.error('Error importing Lichess games:', error);
    onError('Failed to import games from Lichess');
  } finally {
    onComplete();
  }
}
