import Dexie, { Table } from 'dexie';
import { SavedGame, UploadedPGN, GameAnalysis, DrillResult, TacticsProgress, QueuedPosition, QueuedGame, PositionNotes } from './types';

export class BookItDatabase extends Dexie {
  savedGames!: Table<SavedGame, string>;
  uploadedPGNs!: Table<UploadedPGN, string>;
  gameAnalyses!: Table<GameAnalysis, [string, string]>;
  drillResults!: Table<DrillResult, string>;
  tacticsProgress!: Table<TacticsProgress, string>;
  queuedPositions!: Table<QueuedPosition, string>;
  queuedGames!: Table<QueuedGame, string>;
  positionNotes!: Table<PositionNotes, string>;

  constructor() {
    super('BookItDatabase');
    
    this.version(1).stores({
      savedGames: 'id, timestamp, source',
      uploadedPGNs: 'id, filename, type',
      gameAnalyses: '[gameID+repertoireID], gameID, repertoireID',
      drillResults: 'id, fen, correct, timestamp',
      tacticsProgress: 'id, lastSolvedTimestamp',
      queuedPositions: 'id, fen, timestamp',
      queuedGames: 'id, gameID, timestamp',
      positionNotes: 'fen, source, status'
    });
  }
}

export const db = new BookItDatabase();