import { GradualRepertoire } from "./types";
import { db } from "./db";

export class GradualRepertoireClient {
  static async getById(id: string): Promise<GradualRepertoire | undefined> {
    return await db.gradualRepertoires.get(id);
  }

  static async getAll(): Promise<GradualRepertoire[]> {
    return await db.gradualRepertoires.toArray();
  }

  static async insert(repertoire: GradualRepertoire): Promise<string> {
    await db.gradualRepertoires.add(repertoire);
    return repertoire.id;
  }

  static async updateLines(id: string, lines: string[][]): Promise<number> {
    return await db.gradualRepertoires.update(id, { lines });
  }

  static async addLine(id: string, moves: string[]): Promise<number> {
    const existing = await db.gradualRepertoires.get(id);
    if (!existing) return 0;
    return await db.gradualRepertoires.update(id, {
      lines: [...existing.lines, moves],
    });
  }

  static async updateCachedCoveragePercent(
    id: string,
    coverage: number,
  ): Promise<number> {
    return await db.gradualRepertoires.update(id, {
      cachedCoveragePercent: coverage,
    });
  }

  static async updateMetadata(
    id: string,
    fields: Partial<
      Pick<
        GradualRepertoire,
        | "name"
        | "startingFEN"
        | "startingMoves"
        | "sourceRepertoireId"
        | "coverageDepthPlies"
        | "minimumGamesThreshold"
      >
    >,
  ): Promise<number> {
    return await db.gradualRepertoires.update(id, fields);
  }

  static async delete(id: string): Promise<void> {
    await db.gradualRepertoires.delete(id);
  }
}
