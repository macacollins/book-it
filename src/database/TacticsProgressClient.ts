import { TacticsProgress } from "./types";
import { db } from "./db";

export class TacticsProgressClient {
  /**
   * Retrieves tactics progress by its ID
   * @param id The unique identifier of the progress record
   * @returns Promise resolving to the tactics progress or undefined if not found
   */
  static async getById(id: string): Promise<TacticsProgress | undefined> {
    return await db.tacticsProgress.get(id);
  }

  /**
   * Retrieves all tactics progress records
   * @returns Promise resolving to array of all tactics progress records
   */
  static async getAll(): Promise<TacticsProgress[]> {
    return await db.tacticsProgress.toArray();
  }

  /**
   * Retrieves tactics progress records within a timestamp range
   * @param fromTimestamp Start timestamp (inclusive)
   * @param toTimestamp End timestamp (inclusive)
   * @returns Promise resolving to array of progress records within the range
   */
  static async getByTimestampRange(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<TacticsProgress[]> {
    return await db.tacticsProgress
      .where("lastSolvedTimestamp")
      .between(fromTimestamp, toTimestamp, true, true)
      .toArray();
  }

  /**
   * Retrieves recent tactics progress records (most recent first)
   * @param limit Maximum number of records to return
   * @returns Promise resolving to array of recent progress records
   */
  static async getRecent(limit: number = 10): Promise<TacticsProgress[]> {
    return await db.tacticsProgress
      .orderBy("lastSolvedTimestamp")
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Retrieves tactics progress records with completion percentage above threshold
   * @param minCompletionPercentage Minimum completion percentage (0-1)
   * @returns Promise resolving to array of progress records above threshold
   */
  static async getByCompletionThreshold(
    minCompletionPercentage: number,
  ): Promise<TacticsProgress[]> {
    return await db.tacticsProgress
      .filter((progress) => {
        const completionRate =
          progress.totalTactics > 0
            ? progress.tacticsSolved.length / progress.totalTactics
            : 0;
        return completionRate >= minCompletionPercentage;
      })
      .toArray();
  }

  /**
   * Inserts a new tactics progress record
   * @param progress The progress record to insert
   * @returns Promise resolving to the inserted record's ID
   */
  static async insert(progress: TacticsProgress): Promise<string> {
    await db.tacticsProgress.add(progress);
    return progress.id;
  }

  /**
   * Inserts multiple tactics progress records in a single transaction
   * @param progressRecords Array of progress records to insert
   * @returns Promise resolving to array of inserted record IDs
   */
  static async insertMany(
    progressRecords: TacticsProgress[],
  ): Promise<string[]> {
    await db.tacticsProgress.bulkAdd(progressRecords);
    return progressRecords.map((progress) => progress.id);
  }

  /**
   * Updates tactics progress by adding solved tactics
   * @param id The ID of the progress record to update
   * @param solvedTacticIndices Array of newly solved tactic indices
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async updateTacticsSolved(
    id: string,
    solvedTacticIndices: number[],
  ): Promise<number> {
    const progress = await db.tacticsProgress.get(id);
    if (!progress) return 0;

    const updatedSolved = Array.from(
      new Set([...progress.tacticsSolved, ...solvedTacticIndices]),
    );

    return await db.tacticsProgress.update(id, {
      tacticsSolved: updatedSolved,
      lastSolvedTimestamp: Date.now(),
    });
  }

  /**
   * Updates the total tactics count for a progress record
   * @param id The ID of the progress record to update
   * @param totalTactics New total tactics count
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async updateTotalTactics(
    id: string,
    totalTactics: number,
  ): Promise<number> {
    return await db.tacticsProgress.update(id, { totalTactics });
  }

  /**
   * Marks a single tactic as solved
   * @param id The ID of the progress record
   * @param tacticIndex The index of the solved tactic
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async markTacticSolved(
    id: string,
    tacticIndex: number,
  ): Promise<number> {
    const progress = await db.tacticsProgress.get(id);
    if (!progress) return 0;

    if (progress.tacticsSolved.includes(tacticIndex)) {
      return 0; // Already solved
    }

    const updatedSolved = [...progress.tacticsSolved, tacticIndex];

    return await db.tacticsProgress.update(id, {
      tacticsSolved: updatedSolved,
      lastSolvedTimestamp: Date.now(),
    });
  }

  /**
   * Removes a tactic from solved list (mark as unsolved)
   * @param id The ID of the progress record
   * @param tacticIndex The index of the tactic to mark as unsolved
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async markTacticUnsolved(
    id: string,
    tacticIndex: number,
  ): Promise<number> {
    const progress = await db.tacticsProgress.get(id);
    if (!progress) return 0;

    const updatedSolved = progress.tacticsSolved.filter(
      (index) => index !== tacticIndex,
    );

    return await db.tacticsProgress.update(id, {
      tacticsSolved: updatedSolved,
    });
  }

  /**
   * Gets completion statistics for a progress record
   * @param id The ID of the progress record
   * @returns Promise resolving to completion statistics or undefined if not found
   */
  static async getCompletionStats(id: string): Promise<
    | {
        totalTactics: number;
        solvedCount: number;
        remainingCount: number;
        completionPercentage: number;
        lastSolvedTimestamp: number;
      }
    | undefined
  > {
    const progress = await db.tacticsProgress.get(id);
    if (!progress) return undefined;

    const solvedCount = progress.tacticsSolved.length;
    const remainingCount = Math.max(0, progress.totalTactics - solvedCount);
    const completionPercentage =
      progress.totalTactics > 0 ? solvedCount / progress.totalTactics : 0;

    return {
      totalTactics: progress.totalTactics,
      solvedCount,
      remainingCount,
      completionPercentage,
      lastSolvedTimestamp: progress.lastSolvedTimestamp,
    };
  }

  /**
   * Updates a tactics progress record
   * @param id The ID of the record to update
   * @param updates Partial progress object with fields to update
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async update(
    id: string,
    updates: Partial<Omit<TacticsProgress, "id">>,
  ): Promise<number> {
    return await db.tacticsProgress.update(id, updates);
  }

  /**
   * Deletes a tactics progress record by ID
   * @param id The unique identifier of the record to delete
   * @returns Promise resolving to void
   */
  static async delete(id: string): Promise<void> {
    await db.tacticsProgress.delete(id);
  }

  /**
   * Deletes multiple tactics progress records by their IDs
   * @param ids Array of record IDs to delete
   * @returns Promise resolving to void
   */
  static async deleteMany(ids: string[]): Promise<void> {
    await db.tacticsProgress.bulkDelete(ids);
  }

  /**
   * Deletes progress records older than a specific timestamp
   * @param timestamp The cutoff timestamp
   * @returns Promise resolving to number of deleted records
   */
  static async deleteOlderThan(timestamp: number): Promise<number> {
    const records = await db.tacticsProgress
      .where("lastSolvedTimestamp")
      .below(timestamp)
      .toArray();
    await db.tacticsProgress
      .where("lastSolvedTimestamp")
      .below(timestamp)
      .delete();
    return records.length;
  }

  /**
   * Checks if a tactics progress record exists with the given ID
   * @param id The unique identifier to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async exists(id: string): Promise<boolean> {
    const count = await db.tacticsProgress.where("id").equals(id).count();
    return count > 0;
  }

  /**
   * Gets the total count of tactics progress records
   * @returns Promise resolving to the total number of progress records
   */
  static async count(): Promise<number> {
    return await db.tacticsProgress.count();
  }

  /**
   * Clears all tactics progress records from the database
   * @returns Promise resolving to void
   */
  static async clear(): Promise<void> {
    await db.tacticsProgress.clear();
  }
}
