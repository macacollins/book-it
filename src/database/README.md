# Database Clients

This folder contains strongly-typed database clients for the Book It! Chess Training App. All clients use [Dexie.js](https://dexie.org/) for IndexedDB interactions.

## Architecture

### Database Schema
The database is defined in `db.ts` with the following tables:
- `savedGames` - Chess games from various sources
- `uploadedPGNs` - User-uploaded PGN files
- `gameAnalyses` - Analysis results comparing games to repertoires  
- `drillResults` - Results from chess position drills
- `tacticsProgress` - Progress tracking for tactics training
- `queuedPositions` - Chess positions queued for study
- `queuedGames` - Games queued for review with annotations

### Client Pattern
Each client follows a consistent pattern:
- **Static methods** - All operations are static class methods
- **CRUD operations** - Create, Read, Update, Delete functionality
- **Batch operations** - Bulk insert/delete for performance
- **Query methods** - Specialized queries for common use cases
- **Utility methods** - Existence checks, counts, clearing data

## Client Documentation

### SavedGameClient
Manages chess games from Chess.com, Lichess, or manual input.

**Key Operations:**
- `getById(id)` - Retrieve game by ID
- `getBySource(source)` - Filter by game source
- `getByTimestampRange(from, to)` - Time-based queries
- `insert(game)` - Add new game
- `delete(id)` - Remove game

### UploadedPGNClient  
Manages user-uploaded PGN files (tactics, repertoire, games).

**Key Operations:**
- `getByType(type)` - Filter by PGN type
- `getByFilename(filename)` - Search by filename
- `existsByFilename(filename)` - Check filename conflicts
- `deleteByType(type)` - Bulk delete by type

### GameAnalysisClient
Stores analysis results comparing games against repertoires.

**Key Operations:**
- `get(gameID, repertoireID)` - Composite key lookup
- `getByGameID(gameID)` - All analyses for a game
- `getByRepertoireID(repertoireID)` - All analyses for a repertoire
- `upsert(analysis)` - Insert or update analysis

### DrillResultClient
Tracks user performance on chess position drills.

**Key Operations:**
- `getByFEN(fen)` - All results for a position
- `getByCorrectness(correct)` - Filter by success/failure
- `getFENStats(fen)` - Statistics for a position
- `getRecent(limit)` - Most recent results

### TacticsProgressClient
Progress tracking for tactics training sessions.

**Key Operations:**
- `updateTacticsSolved(id, indices)` - Mark tactics as solved
- `markTacticSolved(id, index)` - Mark single tactic solved
- `getCompletionStats(id)` - Get progress statistics
- `getByCompletionThreshold(min)` - Filter by completion rate

### QueuedPositionClient
Manages chess positions queued for study.

**Key Operations:**
- `updateNotes(id, notes)` - Add study notes
- `getWithNotes()` / `getWithoutNotes()` - Filter by annotation
- `searchByNotes(term)` - Search note content
- `upsertByFEN(position)` - Avoid FEN duplicates

### QueuedGameClient
Manages games queued for review with move tree annotations.

**Key Operations:**
- `updateNotes(id, moveTree)` - Add move tree annotations
- `mergeNotes(id, additionalNotes)` - Merge move trees
- `upsertByGameID(game)` - Avoid game duplicates
- `getWithNotes()` - Filter by annotation status

## Usage Examples

```typescript
import { SavedGameClient, DrillResultClient } from './database';

// Save a chess game
const game: SavedGame = {
  id: 'game-123',
  timestamp: Date.now(),
  pgn: '1. e4 e5 2. Nf3...',
  source: 'chess.com'
};
await SavedGameClient.insert(game);

// Get recent drill results
const recentResults = await DrillResultClient.getRecent(10);

// Get statistics for a position
const stats = await DrillResultClient.getFENStats('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
console.log(`Accuracy: ${stats.accuracy * 100}%`);
```

## Database Initialization

The database is automatically initialized when imported:

```typescript
import { db } from './database';

// Database is ready to use
const gameCount = await db.savedGames.count();
```

## Migration Strategy

For schema changes:
1. Increment version in `db.ts`
2. Add migration logic using Dexie's upgrade system
3. Update client methods as needed
4. Test with existing data

## Performance Considerations

- **Indexes** - Defined in schema for common query patterns
- **Bulk Operations** - Use `bulkAdd`/`bulkDelete` for large datasets  
- **Filtering** - Use indexed fields in `where()` clauses when possible
- **Transactions** - Dexie automatically handles transactions for consistency

## Error Handling

All methods can throw:
- `Dexie.DatabaseClosedError` - Database connection closed
- `Dexie.InvalidStateError` - Invalid operation state
- `Dexie.ConstraintError` - Constraint violations (duplicate keys, etc.)
- `Dexie.DataError` - Invalid data format

Wrap operations in try-catch blocks for production use.