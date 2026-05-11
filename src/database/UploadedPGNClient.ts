import { UploadedPGN, PGNType } from "./types";
import { db } from "./db";

export class UploadedPGNClient {
  /**
   * Retrieves an uploaded PGN by its ID
   * @param id The unique identifier of the PGN
   * @returns Promise resolving to the uploaded PGN or undefined if not found
   */
  static async getById(id: string): Promise<UploadedPGN | undefined> {
    return await db.uploadedPGNs.get(id);
  }

  /**
   * Retrieves all uploaded PGNs
   * @returns Promise resolving to array of all uploaded PGNs
   */
  static async getAll(): Promise<UploadedPGN[]> {
    return await db.uploadedPGNs.toArray();
  }

  /**
   * Retrieves uploaded PGNs by type
   * @param type The PGN type to filter by
   * @returns Promise resolving to array of PGNs of the specified type
   */
  static async getByType(type: PGNType): Promise<UploadedPGN[]> {
    return await db.uploadedPGNs.where("type").equals(type).toArray();
  }

  /**
   * Retrieves uploaded PGNs by filename (partial match)
   * @param filename The filename or partial filename to search for
   * @returns Promise resolving to array of matching PGNs
   */
  static async getByFilename(filename: string): Promise<UploadedPGN[]> {
    return await db.uploadedPGNs
      .filter((pgn) =>
        pgn.filename.toLowerCase().includes(filename.toLowerCase()),
      )
      .toArray();
  }

  /**
   * Retrieves uploaded PGNs by exact filename
   * @param filename The exact filename to search for
   * @returns Promise resolving to array of PGNs with matching filename
   */
  static async getByExactFilename(filename: string): Promise<UploadedPGN[]> {
    return await db.uploadedPGNs.where("filename").equals(filename).toArray();
  }

  /**
   * Inserts a new uploaded PGN
   * @param pgn The PGN to insert
   * @returns Promise resolving to the inserted PGN's ID
   */
  static async insert(pgn: UploadedPGN): Promise<string> {
    await db.uploadedPGNs.add(pgn);
    return pgn.id;
  }

  /**
   * Inserts multiple uploaded PGNs in a single transaction
   * @param pgns Array of PGNs to insert
   * @returns Promise resolving to array of inserted PGN IDs
   */
  static async insertMany(pgns: UploadedPGN[]): Promise<string[]> {
    await db.uploadedPGNs.bulkAdd(pgns);
    return pgns.map((pgn) => pgn.id);
  }

  /**
   * Updates an uploaded PGN
   * @param id The ID of the PGN to update
   * @param updates Partial PGN object with fields to update
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async update(
    id: string,
    updates: Partial<Omit<UploadedPGN, "id">>,
  ): Promise<number> {
    return await db.uploadedPGNs.update(id, updates);
  }

  /**
   * Deletes an uploaded PGN by ID
   * @param id The unique identifier of the PGN to delete
   * @returns Promise resolving to void
   */
  static async delete(id: string): Promise<void> {
    await db.uploadedPGNs.delete(id);
  }

  /**
   * Deletes multiple uploaded PGNs by their IDs
   * @param ids Array of PGN IDs to delete
   * @returns Promise resolving to void
   */
  static async deleteMany(ids: string[]): Promise<void> {
    await db.uploadedPGNs.bulkDelete(ids);
  }

  /**
   * Deletes all PGNs of a specific type
   * @param type The PGN type to delete
   * @returns Promise resolving to number of deleted records
   */
  static async deleteByType(type: PGNType): Promise<number> {
    const pgns = await db.uploadedPGNs.where("type").equals(type).toArray();
    await db.uploadedPGNs.where("type").equals(type).delete();
    return pgns.length;
  }

  /**
   * Checks if an uploaded PGN exists with the given ID
   * @param id The unique identifier to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async exists(id: string): Promise<boolean> {
    const count = await db.uploadedPGNs.where("id").equals(id).count();
    return count > 0;
  }

  /**
   * Checks if a PGN with the given filename already exists
   * @param filename The filename to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async existsByFilename(filename: string): Promise<boolean> {
    const count = await db.uploadedPGNs
      .where("filename")
      .equals(filename)
      .count();
    return count > 0;
  }

  /**
   * Gets the total count of uploaded PGNs
   * @returns Promise resolving to the total number of uploaded PGNs
   */
  static async count(): Promise<number> {
    return await db.uploadedPGNs.count();
  }

  /**
   * Gets the count of uploaded PGNs by type
   * @param type The PGN type to count
   * @returns Promise resolving to the count of PGNs of the specified type
   */
  static async countByType(type: PGNType): Promise<number> {
    return await db.uploadedPGNs.where("type").equals(type).count();
  }

  /**
   * Clears all uploaded PGNs from the database
   * @returns Promise resolving to void
   */
  static async clear(): Promise<void> {
    await db.uploadedPGNs.clear();
  }
}
