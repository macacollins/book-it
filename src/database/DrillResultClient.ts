import { DrillResult } from './types';
import { db } from './db';

export class DrillResultClient {
  /**
   * Retrieves a drill result by its ID
   * @param id The unique identifier of the drill result
   * @returns Promise resolving to the drill result or undefined if not found
   */
  static async getById(id: string): Promise<DrillResult | undefined> {
    return await db.drillResults.get(id);
  }

  /**
   * Retrieves all drill results
   * @returns Promise resolving to array of all drill results
   */
  static async getAll(): Promise<DrillResult[]> {
    return await db.drillResults.toArray();
  }

  /**
   * Retrieves drill results by FEN position
   * @param fen The FEN string to filter by
   * @returns Promise resolving to array of drill results for the position
   */
  static async getByFEN(fen: string): Promise<DrillResult[]> {
    return await db.drillResults.where('fen').equals(fen).toArray();
  }

  /**
   * Retrieves drill results by correctness
   * @param correct Whether to get correct or incorrect results
   * @returns Promise resolving to array of drill results matching correctness
   */
  static async getByCorrectness(correct: boolean): Promise<DrillResult[]> {
    return await db.drillResults.filter(result => result.correct === correct).toArray();
  }

  /**
   * Retrieves drill results within a timestamp range
   * @param fromTimestamp Start timestamp (inclusive)
   * @param toTimestamp End timestamp (inclusive)
   * @returns Promise resolving to array of drill results within the range
   */
  static async getByTimestampRange(fromTimestamp: number, toTimestamp: number): Promise<DrillResult[]> {
    return await db.drillResults
      .where('timestamp')
      .between(fromTimestamp, toTimestamp, true, true)
      .toArray();
  }

  /**
   * Retrieves recent drill results (most recent first)
   * @param limit Maximum number of results to return
   * @returns Promise resolving to array of recent drill results
   */
  static async getRecent(limit: number = 50): Promise<DrillResult[]> {
    return await db.drillResults
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Retrieves drill results for a specific FEN with statistics
   * @param fen The FEN string to analyze
   * @returns Promise resolving to object with statistics for the position
   */
  static async getFENStats(fen: string): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    incorrectAttempts: number;
    accuracy: number;
    averageTime: number;
    results: DrillResult[];
  }> {
    const results = await db.drillResults.where('fen').equals(fen).toArray();
    const correctAttempts = results.filter(r => r.correct).length;
    const incorrectAttempts = results.length - correctAttempts;
    const totalTime = results.reduce((sum, r) => sum + r.timeTakenSeconds, 0);
    
    return {
      totalAttempts: results.length,
      correctAttempts,
      incorrectAttempts,
      accuracy: results.length > 0 ? correctAttempts / results.length : 0,
      averageTime: results.length > 0 ? totalTime / results.length : 0,
      results
    };
  }

  /**
   * Inserts a new drill result
   * @param result The drill result to insert
   * @returns Promise resolving to the inserted result's ID
   */
  static async insert(result: DrillResult): Promise<string> {
    await db.drillResults.add(result);
    return result.id;
  }

  /**
   * Inserts multiple drill results in a single transaction
   * @param results Array of drill results to insert
   * @returns Promise resolving to array of inserted result IDs
   */
  static async insertMany(results: DrillResult[]): Promise<string[]> {
    await db.drillResults.bulkAdd(results);
    return results.map(result => result.id);
  }

  /**
   * Updates a drill result
   * @param id The ID of the result to update
   * @param updates Partial result object with fields to update
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async update(id: string, updates: Partial<Omit<DrillResult, 'id'>>): Promise<number> {
    return await db.drillResults.update(id, updates);
  }

  /**
   * Deletes a drill result by ID
   * @param id The unique identifier of the result to delete
   * @returns Promise resolving to void
   */
  static async delete(id: string): Promise<void> {
    await db.drillResults.delete(id);
  }

  /**
   * Deletes multiple drill results by their IDs
   * @param ids Array of result IDs to delete
   * @returns Promise resolving to void
   */
  static async deleteMany(ids: string[]): Promise<void> {
    await db.drillResults.bulkDelete(ids);
  }

  /**
   * Deletes all drill results for a specific FEN
   * @param fen The FEN string to delete results for
   * @returns Promise resolving to number of deleted records
   */
  static async deleteByFEN(fen: string): Promise<number> {
    const results = await db.drillResults.where('fen').equals(fen).toArray();
    await db.drillResults.where('fen').equals(fen).delete();
    return results.length;
  }

  /**
   * Deletes drill results older than a specific timestamp
   * @param timestamp The cutoff timestamp
   * @returns Promise resolving to number of deleted records
   */
  static async deleteOlderThan(timestamp: number): Promise<number> {
    const results = await db.drillResults.where('timestamp').below(timestamp).toArray();
    await db.drillResults.where('timestamp').below(timestamp).delete();
    return results.length;
  }

  /**
   * Checks if a drill result exists with the given ID
   * @param id The unique identifier to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async exists(id: string): Promise<boolean> {
    const count = await db.drillResults.where('id').equals(id).count();
    return count > 0;
  }

  /**
   * Gets the total count of drill results
   * @returns Promise resolving to the total number of drill results
   */
  static async count(): Promise<number> {
    return await db.drillResults.count();
  }

  /**
   * Gets the count of drill results for a specific FEN
   * @param fen The FEN string to count results for
   * @returns Promise resolving to the count of results for the position
   */
  static async countByFEN(fen: string): Promise<number> {
    return await db.drillResults.where('fen').equals(fen).count();
  }

  /**
   * Gets the count of correct drill results
   * @returns Promise resolving to the count of correct results
   */
  static async countCorrect(): Promise<number> {
    return await db.drillResults.filter(result => result.correct === true).count();
  }

  /**
   * Gets the count of incorrect drill results
   * @returns Promise resolving to the count of incorrect results
   */
  static async countIncorrect(): Promise<number> {
    return await db.drillResults.filter(result => result.correct === false).count();
  }

  /**
   * Clears all drill results from the database
   * @returns Promise resolving to void
   */
  static async clear(): Promise<void> {
    await db.drillResults.clear();
  }
}