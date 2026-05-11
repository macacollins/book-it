import { PositionNotes } from "./types";
import { db } from "./db";

export class PositionNotesClient {
  /**
   * Retrieves position notes by FEN
   * @param fen The FEN string of the position
   * @returns Promise resolving to the position notes or undefined if not found
   */
  static async getByFEN(fen: string): Promise<PositionNotes | undefined> {
    return await db.positionNotes.get(fen);
  }

  /**
   * Retrieves all position notes
   * @returns Promise resolving to array of all position notes
   */
  static async getAll(): Promise<PositionNotes[]> {
    return await db.positionNotes.toArray();
  }

  /**
   * Retrieves position notes by source
   * @param source The source to filter by
   * @returns Promise resolving to array of position notes from the specified source
   */
  static async getBySource(source: string): Promise<PositionNotes[]> {
    return await db.positionNotes.where("source").equals(source).toArray();
  }

  /**
   * Retrieves position notes by sync status
   * @param status The sync status to filter by
   * @returns Promise resolving to array of position notes with the specified status
   */
  static async getByStatus(
    status: "synced" | "not-synced",
  ): Promise<PositionNotes[]> {
    return await db.positionNotes.where("status").equals(status).toArray();
  }

  /**
   * Retrieves all unsynced position notes
   * @returns Promise resolving to array of unsynced position notes
   */
  static async getUnsynced(): Promise<PositionNotes[]> {
    return await db.positionNotes
      .where("status")
      .equals("not-synced")
      .toArray();
  }

  /**
   * Retrieves position notes by partial notes text match
   * @param searchText The text to search for in notes
   * @returns Promise resolving to array of matching position notes
   */
  static async searchByNotes(searchText: string): Promise<PositionNotes[]> {
    return await db.positionNotes
      .filter((notes) =>
        notes.notes.toLowerCase().includes(searchText.toLowerCase()),
      )
      .toArray();
  }

  /**
   * Inserts new position notes
   * @param positionNotes The position notes to insert
   * @returns Promise resolving to the inserted position's FEN
   */
  static async insert(positionNotes: PositionNotes): Promise<string> {
    await db.positionNotes.add(positionNotes);
    return positionNotes.fen;
  }

  /**
   * Inserts multiple position notes in a single transaction
   * @param positionNotes Array of position notes to insert
   * @returns Promise resolving to array of inserted FENs
   */
  static async insertMany(positionNotes: PositionNotes[]): Promise<string[]> {
    await db.positionNotes.bulkAdd(positionNotes);
    return positionNotes.map((pn) => pn.fen);
  }

  /**
   * Updates position notes
   * @param fen The FEN of the position to update
   * @param updates Partial PositionNotes object with fields to update
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async update(
    fen: string,
    updates: Partial<Omit<PositionNotes, "fen">>,
  ): Promise<number> {
    return await db.positionNotes.update(fen, updates);
  }

  /**
   * Updates only the notes text for a position
   * @param fen The FEN of the position
   * @param notes The new notes text
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async updateNotes(fen: string, notes: string): Promise<number> {
    return await db.positionNotes.update(fen, { notes, status: "not-synced" });
  }

  /**
   * Updates the sync status for a position
   * @param fen The FEN of the position
   * @param status The new sync status
   * @returns Promise resolving to number of updated records (0 or 1)
   */
  static async updateStatus(
    fen: string,
    status: "synced" | "not-synced",
  ): Promise<number> {
    return await db.positionNotes.update(fen, { status });
  }

  /**
   * Marks multiple positions as synced
   * @param fens Array of FENs to mark as synced
   * @returns Promise resolving to void
   */
  static async markAsSynced(fens: string[]): Promise<void> {
    await db.transaction("rw", db.positionNotes, async () => {
      for (const fen of fens) {
        await db.positionNotes.update(fen, { status: "synced" });
      }
    });
  }

  /**
   * Upserts position notes (insert if not exists, update if exists)
   * @param positionNotes The position notes to upsert
   * @returns Promise resolving to the position's FEN
   */
  static async upsert(positionNotes: PositionNotes): Promise<string> {
    await db.positionNotes.put(positionNotes);
    return positionNotes.fen;
  }

  /**
   * Deletes position notes by FEN
   * @param fen The FEN of the position to delete
   * @returns Promise resolving to void
   */
  static async delete(fen: string): Promise<void> {
    await db.positionNotes.delete(fen);
  }

  /**
   * Deletes multiple position notes by their FENs
   * @param fens Array of FENs to delete
   * @returns Promise resolving to void
   */
  static async deleteMany(fens: string[]): Promise<void> {
    await db.positionNotes.bulkDelete(fens);
  }

  /**
   * Deletes all position notes from a specific source
   * @param source The source to delete notes from
   * @returns Promise resolving to number of deleted records
   */
  static async deleteBySource(source: string): Promise<number> {
    const notes = await db.positionNotes
      .where("source")
      .equals(source)
      .toArray();
    await db.positionNotes.where("source").equals(source).delete();
    return notes.length;
  }

  /**
   * Checks if position notes exist for the given FEN
   * @param fen The FEN to check
   * @returns Promise resolving to boolean indicating existence
   */
  static async exists(fen: string): Promise<boolean> {
    const count = await db.positionNotes.where("fen").equals(fen).count();
    return count > 0;
  }

  /**
   * Gets the total count of position notes
   * @returns Promise resolving to the total number of position notes
   */
  static async count(): Promise<number> {
    return await db.positionNotes.count();
  }

  /**
   * Gets the count of position notes by source
   * @param source The source to count
   * @returns Promise resolving to the count of position notes from the specified source
   */
  static async countBySource(source: string): Promise<number> {
    return await db.positionNotes.where("source").equals(source).count();
  }

  /**
   * Gets the count of unsynced position notes
   * @returns Promise resolving to the count of unsynced position notes
   */
  static async countUnsynced(): Promise<number> {
    return await db.positionNotes.where("status").equals("not-synced").count();
  }

  /**
   * Clears all position notes from the database
   * @returns Promise resolving to void
   */
  static async clear(): Promise<void> {
    await db.positionNotes.clear();
  }
}
