import { PositionUpdateTask } from "./types";
import { db } from "./db";

export class PositionUpdateTaskClient {
  static async getById(id: string): Promise<PositionUpdateTask | undefined> {
    return db.positionUpdateTasks.get(id);
  }

  static async getByGameId(gameId: string): Promise<PositionUpdateTask[]> {
    return db.positionUpdateTasks.where("gameId").equals(gameId).toArray();
  }

  static async getAll(): Promise<PositionUpdateTask[]> {
    return db.positionUpdateTasks.toArray();
  }

  static async getRecent(limit = 50): Promise<PositionUpdateTask[]> {
    return db.positionUpdateTasks
      .orderBy("createdAt")
      .reverse()
      .limit(limit)
      .toArray();
  }

  static async getPending(): Promise<PositionUpdateTask[]> {
    return db.positionUpdateTasks
      .filter((t) => !t.completionStatus)
      .toArray();
  }

  static async insert(task: PositionUpdateTask): Promise<string> {
    await db.positionUpdateTasks.add(task);
    return task.id;
  }

  static async updateCoverage(id: string, coverage: number): Promise<number> {
    return db.positionUpdateTasks.update(id, {
      coverage,
      updatedAt: Date.now(),
    });
  }

  static async markComplete(id: string): Promise<number> {
    return db.positionUpdateTasks.update(id, {
      completionStatus: true,
      updatedAt: Date.now(),
    });
  }
}
