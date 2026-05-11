import { GameAnalysis } from "./types";
import { db } from "./db";

export class GameAnalysisClient {
  /**
   * Retrieves game analysis by composite key (gameID + repertoireID)
   * @param gameID The unique identifier of the game
   * @param repertoireID The unique identifier of the repertoire
   * @returns Promise resolving to the game analysis or undefined if not found
   */
  static async get(
    gameID: string,
    repertoireID: string,
  ): Promise<GameAnalysis | undefined> {
    return await db.gameAnalyses.get([gameID, repertoireID]);
  }

  /**
   * Retrieves all game analyses for a specific game
   * @param gameID The unique identifier of the game
   * @returns Promise resolving to array of analyses for the game
   */
  static async getByGameID(gameID: string): Promise<GameAnalysis[]> {
    return await db.gameAnalyses.where("gameID").equals(gameID).toArray();
  }

  /**
   * Retrieves all game analyses for a specific repertoire
   * @param repertoireID The unique identifier of the repertoire
   * @returns Promise resolving to array of analyses for the repertoire
   */
  static async getByRepertoireID(
    repertoireID: string,
  ): Promise<GameAnalysis[]> {
    return await db.gameAnalyses
      .where("repertoireID")
      .equals(repertoireID)
      .toArray();
  }

  /**
   * Retrieves all game analyses
   * @returns Promise resolving to array of all game analyses
   */
  static async getAll(): Promise<GameAnalysis[]> {
    return await db.gameAnalyses.toArray();
  }

  /**
   * Inserts a new game analysis
   * @param analysis The analysis to insert
   * @returns Promise resolving to the composite key [gameID, repertoireID]
   */
  static async insert(analysis: GameAnalysis): Promise<[string, string]> {
    await db.gameAnalyses.add(analysis);
    return [analysis.gameID, analysis.repertoireID];
  }

  /**
   * Inserts multiple game analyses in a single transaction
   * @param analyses Array of analyses to insert
   * @returns Promise resolving to array of composite keys
   */
  static async insertMany(
    analyses: GameAnalysis[],
  ): Promise<[string, string][]> {
    await db.gameAnalyses.bulkAdd(analyses);
    return analyses.map(
      (analysis) =>
        [analysis.gameID, analysis.repertoireID] as [string, string],
    );
  }

  /**
   * Updates a game analysis
   * @param gameID The game ID
   * @param repertoireID The repertoire ID
   * @param updates Partial analysis object with fields to update
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async update(
    gameID: string,
    repertoireID: string,
    updates: Partial<Omit<GameAnalysis, "gameID" | "repertoireID">>,
  ): Promise<number> {
    return await db.gameAnalyses.update([gameID, repertoireID], updates);
  }

  /**
   * Upserts (insert or update) a game analysis
   * @param analysis The analysis to upsert
   * @returns Promise resolving to the composite key [gameID, repertoireID]
   */
  static async upsert(analysis: GameAnalysis): Promise<[string, string]> {
    await db.gameAnalyses.put(analysis);
    return [analysis.gameID, analysis.repertoireID];
  }

  /**
   * Deletes a game analysis by composite key
   * @param gameID The game ID
   * @param repertoireID The repertoire ID
   * @returns Promise resolving to void
   */
  static async delete(gameID: string, repertoireID: string): Promise<void> {
    await db.gameAnalyses.delete([gameID, repertoireID]);
  }

  /**
   * Deletes all analyses for a specific game
   * @param gameID The unique identifier of the game
   * @returns Promise resolving to number of deleted records
   */
  static async deleteByGameID(gameID: string): Promise<number> {
    const analyses = await db.gameAnalyses
      .where("gameID")
      .equals(gameID)
      .toArray();
    await db.gameAnalyses.where("gameID").equals(gameID).delete();
    return analyses.length;
  }

  /**
   * Deletes all analyses for a specific repertoire
   * @param repertoireID The unique identifier of the repertoire
   * @returns Promise resolving to number of deleted records
   */
  static async deleteByRepertoireID(repertoireID: string): Promise<number> {
    const analyses = await db.gameAnalyses
      .where("repertoireID")
      .equals(repertoireID)
      .toArray();
    await db.gameAnalyses.where("repertoireID").equals(repertoireID).delete();
    return analyses.length;
  }

  /**
   * Deletes multiple game analyses by their composite keys
   * @param keys Array of [gameID, repertoireID] tuples to delete
   * @returns Promise resolving to void
   */
  static async deleteMany(keys: [string, string][]): Promise<void> {
    await db.gameAnalyses.bulkDelete(keys);
  }

  /**
   * Checks if a game analysis exists for the given composite key
   * @param gameID The game ID
   * @param repertoireID The repertoire ID
   * @returns Promise resolving to boolean indicating existence
   */
  static async exists(gameID: string, repertoireID: string): Promise<boolean> {
    const count = await db.gameAnalyses
      .where("[gameID+repertoireID]")
      .equals([gameID, repertoireID])
      .count();
    return count > 0;
  }

  /**
   * Gets the total count of game analyses
   * @returns Promise resolving to the total number of game analyses
   */
  static async count(): Promise<number> {
    return await db.gameAnalyses.count();
  }

  /**
   * Gets the count of analyses for a specific game
   * @param gameID The game ID to count analyses for
   * @returns Promise resolving to the count of analyses for the game
   */
  static async countByGameID(gameID: string): Promise<number> {
    return await db.gameAnalyses.where("gameID").equals(gameID).count();
  }

  /**
   * Gets the count of analyses for a specific repertoire
   * @param repertoireID The repertoire ID to count analyses for
   * @returns Promise resolving to the count of analyses for the repertoire
   */
  static async countByRepertoireID(repertoireID: string): Promise<number> {
    return await db.gameAnalyses
      .where("repertoireID")
      .equals(repertoireID)
      .count();
  }

  /**
   * Clears all game analyses from the database
   * @returns Promise resolving to void
   */
  static async clear(): Promise<void> {
    await db.gameAnalyses.clear();
  }
}
