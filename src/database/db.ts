import Dexie, { Table } from "dexie";
import {
  SavedGame,
  UploadedPGN,
  GameAnalysis,
  DrillResult,
  TacticsProgress,
  QueuedPosition,
  QueuedGame,
  PositionNotes,
  GradualRepertoire,
} from "./types";

export class BookItDatabase extends Dexie {
  savedGames!: Table<SavedGame, string>;
  uploadedPGNs!: Table<UploadedPGN, string>;
  gameAnalyses!: Table<GameAnalysis, [string, string]>;
  drillResults!: Table<DrillResult, string>;
  tacticsProgress!: Table<TacticsProgress, string>;
  queuedPositions!: Table<QueuedPosition, string>;
  queuedGames!: Table<QueuedGame, string>;
  positionNotes!: Table<PositionNotes, string>;
  gradualRepertoires!: Table<GradualRepertoire, string>;

  constructor() {
    super("BookItDatabase");

    this.version(1).stores({
      savedGames: "id, timestamp, source",
      uploadedPGNs: "id, filename, type",
      gameAnalyses: "[gameID+repertoireID], gameID, repertoireID",
      drillResults: "id, fen, correct, timestamp",
      tacticsProgress: "id, lastSolvedTimestamp",
      queuedPositions: "id, fen, timestamp",
      queuedGames: "id, gameID, timestamp",
      positionNotes: "fen, source, status",
    });

    this.version(2).stores({
      savedGames: "id, timestamp, source",
      uploadedPGNs: "id, filename, type",
      gameAnalyses: "[gameID+repertoireID], gameID, repertoireID",
      drillResults: "id, fen, correct, timestamp",
      tacticsProgress: "id, lastSolvedTimestamp",
      queuedPositions: "id, fen, timestamp",
      queuedGames: "id, gameID, timestamp",
      positionNotes: "fen, source, status",
      gradualRepertoires: "id, timestamp",
    });

    this.version(3)
      .stores({
        savedGames: "id, timestamp, source",
        uploadedPGNs: "id, filename, type",
        gameAnalyses: "[gameID+repertoireID], gameID, repertoireID",
        drillResults: "id, fen, correct, timestamp",
        tacticsProgress: "id, lastSolvedTimestamp",
        queuedPositions: "id, fen, timestamp",
        queuedGames: "id, gameID, timestamp",
        positionNotes: "fen, source, status",
        gradualRepertoires: "id, timestamp",
      })
      .upgrade((trans) => {
        return trans
          .table("gradualRepertoires")
          .toCollection()
          .modify((rep: any) => {
            if (!Array.isArray(rep.startingMoves)) {
              rep.startingMoves = [];
            }
            if (Array.isArray(rep.lines)) {
              rep.lines = rep.lines.map((line: unknown) => {
                if (typeof line === "string") {
                  try {
                    return JSON.parse(line);
                  } catch {
                    return [];
                  }
                }
                return Array.isArray(line) ? line : [];
              });
            }
          });
      });

    this.version(4)
      .stores({
        savedGames: "id, timestamp, source",
        uploadedPGNs: "id, filename, type",
        gameAnalyses: "[gameID+repertoireID], gameID, repertoireID",
        drillResults: "id, fen, correct, timestamp",
        tacticsProgress: "id, lastSolvedTimestamp",
        queuedPositions: "id, fen, timestamp",
        queuedGames: "id, gameID, timestamp",
        positionNotes: "fen, source, status",
        gradualRepertoires: "id, timestamp",
      })
      .upgrade((trans) => {
        return trans
          .table("gradualRepertoires")
          .toCollection()
          .modify((rep: any) => {
            if (rep.coverageDepthPlies === undefined) {
              rep.coverageDepthPlies = 7;
            }
            if (rep.minimumGamesThreshold === undefined) {
              rep.minimumGamesThreshold = 5;
            }
            if (rep.cachedCoveragePercent === undefined) {
              rep.cachedCoveragePercent = null;
            }
          });
      });
  }
}

export const db = new BookItDatabase();
