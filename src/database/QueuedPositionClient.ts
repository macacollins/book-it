import { QueuedPosition } from './types';
import { db } from './db';

export class QueuedPositionClient {
  /**
   * Retrieves a queued position by its ID
   * @param id The unique identifier of the queued position
   * @returns Promise resolving to the queued position or undefined if not found
   */
  static async getById(id: string): Promise<QueuedPosition | undefined> {
    return await db.queuedPositions.get(id);
  }

  /**
   * Retrieves all queued positions
   * @returns Promise resolving to array of all queued positions
   */
  static async getAll(): Promise<QueuedPosition[]> {
    return await db.queuedPositions.toArray();
  }

  /**
   * Retrieves queued positions by FEN
   * @param fen The FEN string to filter by
   * @returns Promise resolving to array of queued positions for the FEN
   */
  static async getByFEN(fen: string): Promise<QueuedPosition[]> {
    return await db.queuedPositions.where('fen').equals(fen).toArray();
  }

  /**
   * Retrieves queued positions within a timestamp range
   * @param fromTimestamp Start timestamp (inclusive)
   * @param toTimestamp End timestamp (inclusive)
   * @returns Promise resolving to array of positions within the range
   */
  static async getByTimestampRange(fromTimestamp: number, toTimestamp: number): Promise<QueuedPosition[]> {
    return await db.queuedPositions
      .where('timestamp')
      .between(fromTimestamp, toTimestamp, true, true)
      .toArray();
  }

  /**
   * Retrieves recent queued positions (most recent first)
   * @param limit Maximum number of positions to return
   * @returns Promise resolving to array of recent queued positions
   */
  static async getRecent(limit: number = 50): Promise<QueuedPosition[]> {
    return await db.queuedPositions
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Retrieves oldest queued positions (oldest first)
   * @param limit Maximum number of positions to return
   * @returns Promise resolving to array of oldest queued positions
   */
  static async getOldest(limit: number = 50): Promise<QueuedPosition[]> {
    return await db.queuedPositions
      .orderBy('timestamp')
      .limit(limit)
      .toArray();
  }

  /**
   * Searches queued positions by notes content
   * @param searchTerm The term to search for in notes
   * @returns Promise resolving to array of positions with matching notes
   */
  static async searchByNotes(searchTerm: string): Promise<QueuedPosition[]> {
    return await db.queuedPositions
      .filter(position => position.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      .toArray();
  }

  /**
   * Retrieves positions with empty notes
   * @returns Promise resolving to array of positions without notes
   */
  static async getWithoutNotes(): Promise<QueuedPosition[]> {
    return await db.queuedPositions
      .filter(position => !position.notes || position.notes.trim() === '')
      .toArray();
  }

  /**
   * Retrieves positions with notes
   * @returns Promise resolving to array of positions with notes
   */
  static async getWithNotes(): Promise<QueuedPosition[]> {
    return await db.queuedPositions
      .filter(position => Boolean(position.notes && position.notes.trim() !== ''))
      .toArray();
  }

  /**
   * Inserts a new queued position
   * @param position The position to insert
   * @returns Promise resolving to the inserted position's ID
   */
  static async insert(position: QueuedPosition): Promise<string> {
    await db.queuedPositions.add(position);
    return position.id;
  }

  /**
   * Inserts multiple queued positions in a single transaction
   * @param positions Array of positions to insert
   * @returns Promise resolving to array of inserted position IDs
   */
  static async insertMany(positions: QueuedPosition[]): Promise<string[]> {
    await db.queuedPositions.bulkAdd(positions);
    return positions.map(position => position.id);
  }

  /**
   * Updates the notes for a queued position
   * @param id The ID of the position to update
   * @param notes New notes content
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async updateNotes(id: string, notes: string): Promise<number> {
    return await db.queuedPositions.update(id, { notes });
  }

  /**
   * Updates a queued position
   * @param id The ID of the position to update
   * @param updates Partial position object with fields to update
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async update(id: string, updates: Partial<Omit<QueuedPosition, 'id'>>): Promise<number> {
    return await db.queuedPositions.update(id, updates);
  }

  /**
   * Upserts (insert or update) a queued position by FEN
   * If a position with the same FEN exists, updates it; otherwise inserts new
   * @param position The position to upsert
   * @returns Promise resolving to the position ID
   */
  static async upsertByFEN(position: QueuedPosition): Promise<string> {
    const existing = await db.queuedPositions.where('fen').equals(position.fen).first();
    
    if (existing) {
      await db.queuedPositions.update(existing.id, {
        notes: position.notes,
        timestamp: position.timestamp
      });
      return existing.id;
    } else {
      await db.queuedPositions.add(position);
      return position.id;
    }
  }

  /**
   * Deletes a queued position by ID
   * @param id The unique identifier of the position to delete
   * @returns Promise resolving to void
   */
  static async delete(id: string): Promise<void> {
    await db.queuedPositions.delete(id);
  }

  /**
   * Deletes multiple queued positions by their IDs
   * @param ids Array of position IDs to delete
   * @returns Promise resolving to void
   */
  static async deleteMany(ids: string[]): Promise<void> {
    await db.queuedPositions.bulkDelete(ids);
  }

  /**
   * Deletes all positions with a specific FEN
   * @param fen The FEN string to delete positions for
   * @returns Promise resolving to number of deleted records
   */
  static async deleteByFEN(fen: string): Promise<number> {
    const positions = await db.queuedPositions.where('fen').equals(fen).toArray();
    await db.queuedPositions.where('fen').equals(fen).delete();
    return positions.length;
  }

  /**
   * Deletes positions older than a specific timestamp
   * @param timestamp The cutoff timestamp
   * @returns Promise resolving to number of deleted records
   */
  static async deleteOlderThan(timestamp: number): Promise<number> {
    const positions = await db.queuedPositions.where('timestamp').below(timestamp).toArray();
    await db.queuedPositions.where('timestamp').below(timestamp).delete();
    return positions.length;
  }

  /**
   * Deletes positions without notes
   * @returns Promise resolving to number of deleted records
   */
  static async deleteWithoutNotes(): Promise<number> {
    const positions = await db.queuedPositions
      .filter(position => !position.notes || position.notes.trim() === '')
      .toArray();
    
    const ids = positions.map(p => p.id);
    await db.queuedPositions.bulkDelete(ids);
    return positions.length;
  }

  /**
   * Checks if a queued position exists with the given ID
   * @param id The unique identifier to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async exists(id: string): Promise<boolean> {
    const count = await db.queuedPositions.where('id').equals(id).count();
    return count > 0;
  }

  /**
   * Checks if a position with the given FEN exists
   * @param fen The FEN string to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async existsByFEN(fen: string): Promise<boolean> {
    const count = await db.queuedPositions.where('fen').equals(fen).count();
    return count > 0;
  }

  /**
   * Gets the total count of queued positions
   * @returns Promise resolving to the total number of queued positions
   */
  static async count(): Promise<number> {
    return await db.queuedPositions.count();
  }

  /**
   * Gets the count of positions with notes
   * @returns Promise resolving to the count of positions with notes
   */
  static async countWithNotes(): Promise<number> {
    return await db.queuedPositions
      .filter(position => Boolean(position.notes && position.notes.trim() !== ''))
      .count();
  }

  /**
   * Gets the count of positions without notes
   * @returns Promise resolving to the count of positions without notes
   */
  static async countWithoutNotes(): Promise<number> {
    return await db.queuedPositions
      .filter(position => !position.notes || position.notes.trim() === '')
      .count();
  }

  /**
   * Clears all queued positions from the database
   * @returns Promise resolving to void
   */
  static async clear(): Promise<void> {
    await db.queuedPositions.clear();
  }
}