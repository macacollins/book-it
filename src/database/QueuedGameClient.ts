import { QueuedGame } from './types';
import { db } from './db';

export class QueuedGameClient {
  /**
   * Retrieves a queued game by its ID
   * @param id The unique identifier of the queued game
   * @returns Promise resolving to the queued game or undefined if not found
   */
  static async getById(id: string): Promise<QueuedGame | undefined> {
    return await db.queuedGames.get(id);
  }

  /**
   * Retrieves all queued games
   * @returns Promise resolving to array of all queued games
   */
  static async getAll(): Promise<QueuedGame[]> {
    return await db.queuedGames.toArray();
  }

  /**
   * Retrieves queued games by game ID
   * @param gameID The game ID to filter by
   * @returns Promise resolving to array of queued games for the game ID
   */
  static async getByGameID(gameID: string): Promise<QueuedGame[]> {
    return await db.queuedGames.where('gameID').equals(gameID).toArray();
  }

  /**
   * Retrieves queued games within a timestamp range
   * @param fromTimestamp Start timestamp (inclusive)
   * @param toTimestamp End timestamp (inclusive)
   * @returns Promise resolving to array of games within the range
   */
  static async getByTimestampRange(fromTimestamp: number, toTimestamp: number): Promise<QueuedGame[]> {
    return await db.queuedGames
      .where('timestamp')
      .between(fromTimestamp, toTimestamp, true, true)
      .toArray();
  }

  /**
   * Retrieves recent queued games (most recent first)
   * @param limit Maximum number of games to return
   * @returns Promise resolving to array of recent queued games
   */
  static async getRecent(limit: number = 50): Promise<QueuedGame[]> {
    return await db.queuedGames
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Retrieves oldest queued games (oldest first)
   * @param limit Maximum number of games to return
   * @returns Promise resolving to array of oldest queued games
   */
  static async getOldest(limit: number = 50): Promise<QueuedGame[]> {
    return await db.queuedGames
      .orderBy('timestamp')
      .limit(limit)
      .toArray();
  }

  /**
   * Retrieves games with non-empty move tree notes
   * @returns Promise resolving to array of games with move tree content
   */
  static async getWithNotes(): Promise<QueuedGame[]> {
    return await db.queuedGames
      .filter(game => {
        // Check if the MoveTree has any content
        const hasContent = game.notes && 
          (game.notes.nodes.length > 0 || 
           Boolean(game.notes.name && game.notes.name.trim() !== '') ||
           Object.keys(game.notes.headers || {}).length > 0);
        return Boolean(hasContent);
      })
      .toArray();
  }

  /**
   * Retrieves games without move tree notes
   * @returns Promise resolving to array of games without move tree content
   */
  static async getWithoutNotes(): Promise<QueuedGame[]> {
    return await db.queuedGames
      .filter(game => {
        const hasContent = game.notes && 
          (game.notes.nodes.length > 0 || 
           Boolean(game.notes.name && game.notes.name.trim() !== '') ||
           Object.keys(game.notes.headers || {}).length > 0);
        return !hasContent;
      })
      .toArray();
  }

  /**
   * Inserts a new queued game
   * @param game The game to insert
   * @returns Promise resolving to the inserted game's ID
   */
  static async insert(game: QueuedGame): Promise<string> {
    await db.queuedGames.add(game);
    return game.id;
  }

  /**
   * Inserts multiple queued games in a single transaction
   * @param games Array of games to insert
   * @returns Promise resolving to array of inserted game IDs
   */
  static async insertMany(games: QueuedGame[]): Promise<string[]> {
    await db.queuedGames.bulkAdd(games);
    return games.map(game => game.id);
  }

  /**
   * Updates the notes (MoveTree) for a queued game
   * @param id The ID of the game to update
   * @param notes New move tree notes
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async updateNotes(id: string, notes: QueuedGame['notes']): Promise<number> {
    return await db.queuedGames.update(id, { notes });
  }

  /**
   * Updates a queued game
   * @param id The ID of the game to update
   * @param updates Partial game object with fields to update
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async update(id: string, updates: Partial<Omit<QueuedGame, 'id'>>): Promise<number> {
    return await db.queuedGames.update(id, updates);
  }

  /**
   * Upserts (insert or update) a queued game by gameID
   * If a game with the same gameID exists, updates it; otherwise inserts new
   * @param game The game to upsert
   * @returns Promise resolving to the game ID
   */
  static async upsertByGameID(game: QueuedGame): Promise<string> {
    const existing = await db.queuedGames.where('gameID').equals(game.gameID).first();
    
    if (existing) {
      await db.queuedGames.update(existing.id, {
        notes: game.notes,
        timestamp: game.timestamp
      });
      return existing.id;
    } else {
      await db.queuedGames.add(game);
      return game.id;
    }
  }

  /**
   * Merges move tree notes for an existing queued game
   * @param id The ID of the game to update
   * @param additionalNotes Additional move tree to merge
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async mergeNotes(id: string, additionalNotes: QueuedGame['notes']): Promise<number> {
    const existing = await db.queuedGames.get(id);
    if (!existing) return 0;

    // Merge the move trees - combine nodes and headers
    const mergedNotes = {
      name: additionalNotes.name || existing.notes?.name || '',
      headers: {
        ...existing.notes?.headers,
        ...additionalNotes.headers
      },
      nodes: [
        ...(existing.notes?.nodes || []),
        ...additionalNotes.nodes
      ]
    };

    return await db.queuedGames.update(id, { notes: mergedNotes });
  }

  /**
   * Deletes a queued game by ID
   * @param id The unique identifier of the game to delete
   * @returns Promise resolving to void
   */
  static async delete(id: string): Promise<void> {
    await db.queuedGames.delete(id);
  }

  /**
   * Deletes multiple queued games by their IDs
   * @param ids Array of game IDs to delete
   * @returns Promise resolving to void
   */
  static async deleteMany(ids: string[]): Promise<void> {
    await db.queuedGames.bulkDelete(ids);
  }

  /**
   * Deletes all games with a specific gameID
   * @param gameID The game ID to delete games for
   * @returns Promise resolving to number of deleted records
   */
  static async deleteByGameID(gameID: string): Promise<number> {
    const games = await db.queuedGames.where('gameID').equals(gameID).toArray();
    await db.queuedGames.where('gameID').equals(gameID).delete();
    return games.length;
  }

  /**
   * Deletes games older than a specific timestamp
   * @param timestamp The cutoff timestamp
   * @returns Promise resolving to number of deleted records
   */
  static async deleteOlderThan(timestamp: number): Promise<number> {
    const games = await db.queuedGames.where('timestamp').below(timestamp).toArray();
    await db.queuedGames.where('timestamp').below(timestamp).delete();
    return games.length;
  }

  /**
   * Deletes games without notes
   * @returns Promise resolving to number of deleted records
   */
  static async deleteWithoutNotes(): Promise<number> {
    const games = await db.queuedGames
      .filter(game => {
        const hasContent = game.notes && 
          (game.notes.nodes.length > 0 || 
           Boolean(game.notes.name && game.notes.name.trim() !== '') ||
           Object.keys(game.notes.headers || {}).length > 0);
        return !hasContent;
      })
      .toArray();
    
    const ids = games.map(g => g.id);
    await db.queuedGames.bulkDelete(ids);
    return games.length;
  }

  /**
   * Checks if a queued game exists with the given ID
   * @param id The unique identifier to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async exists(id: string): Promise<boolean> {
    const count = await db.queuedGames.where('id').equals(id).count();
    return count > 0;
  }

  /**
   * Checks if a game with the given gameID exists
   * @param gameID The game ID to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async existsByGameID(gameID: string): Promise<boolean> {
    const count = await db.queuedGames.where('gameID').equals(gameID).count();
    return count > 0;
  }

  /**
   * Gets the total count of queued games
   * @returns Promise resolving to the total number of queued games
   */
  static async count(): Promise<number> {
    return await db.queuedGames.count();
  }

  /**
   * Gets the count of games with notes
   * @returns Promise resolving to the count of games with notes
   */
  static async countWithNotes(): Promise<number> {
    return await db.queuedGames
      .filter(game => {
        const hasContent = game.notes && 
          (game.notes.nodes.length > 0 || 
           Boolean(game.notes.name && game.notes.name.trim() !== '') ||
           Object.keys(game.notes.headers || {}).length > 0);
        return Boolean(hasContent);
      })
      .count();
  }

  /**
   * Gets the count of games without notes
   * @returns Promise resolving to the count of games without notes
   */
  static async countWithoutNotes(): Promise<number> {
    return await db.queuedGames
      .filter(game => {
        const hasContent = game.notes && 
          (game.notes.nodes.length > 0 || 
           Boolean(game.notes.name && game.notes.name.trim() !== '') ||
           Object.keys(game.notes.headers || {}).length > 0);
        return !hasContent;
      })
      .count();
  }

  /**
   * Clears all queued games from the database
   * @returns Promise resolving to void
   */
  static async clear(): Promise<void> {
    await db.queuedGames.clear();
  }
}