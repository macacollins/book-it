import { fetchChessComGames } from "../integrations/chess-com-client";
import { SavedGameClient, SavedGame } from "./index";

export interface SyncChessComGamesParams {
  username: string;
  onStart: () => void;
  onComplete: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataChanged: () => void;
}

export async function syncChessComGames({
  username,
  onStart,
  onComplete,
  onSuccess,
  onError,
  onDataChanged,
}: SyncChessComGamesParams): Promise<void> {
  if (!username.trim()) {
    onError("Please enter a Chess.com username");
    return;
  }

  onStart();
  try {
    const games = await fetchChessComGames(username.trim());

    let importCount = 0;
    for (const game of games) {
      const savedGame: SavedGame = {
        id: `chesscom-${game.url.split("/").pop() || Date.now()}`,
        timestamp: game.end_time * 1000, // Convert to milliseconds
        pgn: game.pgn,
        source: "chess.com",
      };

      // Check if game already exists
      const exists = await SavedGameClient.exists(savedGame.id);
      if (!exists) {
        await SavedGameClient.insert(savedGame);
        importCount++;
      }
    }

    onSuccess(`Successfully imported ${importCount} new games from Chess.com`);
    onDataChanged();
  } catch (error) {
    console.error("Error importing Chess.com games:", error);
    onError("Failed to import games from Chess.com");
  } finally {
    onComplete();
  }
}
