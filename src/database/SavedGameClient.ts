import { SavedGame } from './types';
import { db } from './db';

export class SavedGameClient {
  /**
   * Retrieves a saved game by its ID
   * @param id The unique identifier of the game
   * @returns Promise resolving to the saved game or undefined if not found
   */
  static async getById(id: string): Promise<SavedGame | undefined> {
    return await db.savedGames.get(id);
  }

  /**
   * Retrieves all saved games
   * @returns Promise resolving to array of all saved games
   */
  static async getAll(): Promise<SavedGame[]> {
    return await db.savedGames.toArray();
  }

  /**
   * Retrieves saved games by source
   * @param source The game source to filter by
   * @returns Promise resolving to array of games from the specified source
   */
  static async getBySource(source: SavedGame['source']): Promise<SavedGame[]> {
    return await db.savedGames.where('source').equals(source).toArray();
  }

  /**
   * Retrieves saved games within a timestamp range
   * @param fromTimestamp Start timestamp (inclusive)
   * @param toTimestamp End timestamp (inclusive)
   * @returns Promise resolving to array of games within the range
   */
  static async getByTimestampRange(fromTimestamp: number, toTimestamp: number): Promise<SavedGame[]> {
    return await db.savedGames
      .where('timestamp')
      .between(fromTimestamp, toTimestamp, true, true)
      .toArray();
  }

  /**
   * Inserts a new saved game
   * @param game The game to insert
   * @returns Promise resolving to the inserted game's ID
   */
  static async insert(game: SavedGame): Promise<string> {
    await db.savedGames.add(game);
    return game.id;
  }

  /**
   * Inserts multiple saved games in a single transaction
   * @param games Array of games to insert
   * @returns Promise resolving to array of inserted game IDs
   */
  static async insertMany(games: SavedGame[]): Promise<string[]> {
    await db.savedGames.bulkAdd(games);
    return games.map(game => game.id);
  }

  /**
   * Updates a saved game
   * @param id The ID of the game to update
   * @param updates Partial game object with fields to update
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async update(id: string, updates: Partial<Omit<SavedGame, 'id'>>): Promise<number> {
    return await db.savedGames.update(id, updates);
  }

  /**
   * Deletes a saved game by ID
   * @param id The unique identifier of the game to delete
   * @returns Promise resolving to void
   */
  static async delete(id: string): Promise<void> {
    await db.savedGames.delete(id);
  }

  /**
   * Deletes multiple saved games by their IDs
   * @param ids Array of game IDs to delete
   * @returns Promise resolving to void
   */
  static async deleteMany(ids: string[]): Promise<void> {
    await db.savedGames.bulkDelete(ids);
  }

  /**
   * Checks if a saved game exists with the given ID
   * @param id The unique identifier to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async exists(id: string): Promise<boolean> {
    const count = await db.savedGames.where('id').equals(id).count();
    return count > 0;
  }

  /**
   * Gets the total count of saved games
   * @returns Promise resolving to the total number of saved games
   */
  static async count(): Promise<number> {
    return await db.savedGames.count();
  }

  /**
   * Gets the count of saved games by source
   * @param source The game source to count
   * @returns Promise resolving to the count of games from the source
   */
  static async countBySource(source: SavedGame['source']): Promise<number> {
    return await db.savedGames.where('source').equals(source).count();
  }

  /**
   * Clears all saved games from the database
   * @returns Promise resolving to void
   */
  static async clear(): Promise<void> {
    await db.savedGames.clear();
  }
}