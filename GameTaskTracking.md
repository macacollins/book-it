# Game Task Tracking Feature — Design Document

## Overview

This feature adds a **Game Update Task Checking Algorithm** to the gradual repertoire builder workflow. When the user plays a game that matches a Gradual Repertoire Builder (GRB) position, the system records a `PositionUpdateTask` representing the work needed before that position is considered "covered." The user can trigger the algorithm from a dedicated page, which polls for status updates in real time while the algorithm runs in a Web Worker.

---

## 1. New Database Record: `PositionUpdateTask`

### 1.1 Type Definition (`src/database/types.ts`)

Add the following interface:

```typescript
// Tracks the progress of a matched GRB position from a recent game
// Should support:
// - retrieval by ID
// - retrieval by gameId
// - insertion
// - updating completionStatus and coverage
export interface PositionUpdateTask {
  id: string;              // uuid
  gameId: string;          // FK → SavedGame.id (indexed)
  grbId: string;           // FK → GradualRepertoire.id (indexed)
  latestFEN: string;       // normalised FEN of the matched position
  coverage: number | null; // last-computed coverage rate 0–100, or null if not yet checked
  completionStatus: boolean; // true once coverage >= 90%
  createdAt: number;       // Unix ms timestamp
  updatedAt: number;       // Unix ms timestamp
}
```

### 1.2 Dexie Schema (`src/database/db.ts`)

Add a new schema version (e.g. version 5):

```typescript
this.version(5).stores({
  // ...all existing stores unchanged...
  positionUpdateTasks: "id, gameId, grbId, completionStatus, createdAt",
});
```

Add the table declaration to the `BookItDatabase` class:

```typescript
positionUpdateTasks!: Table<PositionUpdateTask, string>;
```

### 1.3 Database Client (`src/database/PositionUpdateTaskClient.ts`)

Follow the same static-class pattern used by all other clients (e.g. `QueuedPositionClient`, `SavedGameClient`).

Key methods:

| Method | Description |
|---|---|
| `getById(id)` | Retrieve a single record by primary key |
| `getByGameId(gameId)` | Retrieve all tasks for a given game (uses index) |
| `getAll()` | Retrieve every record |
| `getRecent(limit)` | Most-recent `limit` records by `createdAt desc` |
| `getPending()` | All records where `completionStatus === false` |
| `insert(task)` | Add a new record; returns its `id` |
| `updateCoverage(id, coverage)` | Update the `coverage` field and `updatedAt` |
| `markComplete(id)` | Set `completionStatus = true` and `updatedAt` |

Example skeleton:

```typescript
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
```

Export from `src/database/index.ts`:

```typescript
export { PositionUpdateTaskClient } from "./PositionUpdateTaskClient";
export type { PositionUpdateTask } from "./types";
```

---

## 2. Game Update Task Checking Algorithm

The algorithm runs inside a **Web Worker** (see section 4). Its logic per game is:

```
For each recent SavedGame (sorted by timestamp desc, limit 50):
  1. Call matchGameToGRB(game, allGRBs, usernames) → GRBMatchResult | null
     If null → skip this game (no GRB match)

  2. Look up existing PositionUpdateTask records for this gameId
     via PositionUpdateTaskClient.getByGameId(gameId)

  3a. If a record EXISTS for this gameId:
      - If record.completionStatus === true → skip (already done)
      - If record.completionStatus === false:
          * Fetch current GRB coverage for match.beforeFEN
            (reuse logic from CoverageAnalysisWorker / frequencyAnalysisCore)
          * If coverage >= 90:
              PositionUpdateTaskClient.markComplete(record.id)
          * Else:
              PositionUpdateTaskClient.updateCoverage(record.id, coverage)
          * Post a progress message to the main thread

  3b. If NO record exists for this gameId:
      - Create a default PositionUpdateTask:
          id: crypto.randomUUID()
          gameId: game.id
          grbId: match.matchedGRB.id
          latestFEN: match.beforeFEN
          coverage: null
          completionStatus: false
          createdAt: Date.now()
          updatedAt: Date.now()
      - Insert via PositionUpdateTaskClient.insert(task)
      - Then run step 3a logic on the newly-created record

  4. Post progress message (see section 4.2)
```

### 2.1 Coverage Calculation

Re-use the existing `fetchExplorerData` helper from `src/workers/frequencyAnalysisCore.ts` and the GRB `lines` field to calculate the proportion of Lichess master games from `latestFEN` that are covered by the GRB's lines. This mirrors the approach in `CoverageAnalysisWorker.ts`. The coverage value stored in the record is an integer 0–100.

---

## 3. Web Worker: `GameTaskTrackingWorker.ts`

**File:** `src/workers/GameTaskTrackingWorker.ts`

Follow the pattern of `CoverageAnalysisWorker.ts` and `UncoveredPositionsWorker.ts`.

### 3.1 Inbound / Outbound Message Types (`src/workers/gameTaskTrackingTypes.ts`)

```typescript
// Inbound
export interface StartGameTaskTrackingRequest {
  type: "START_GAME_TASK_TRACKING";
  usernames: string[]; // chess.com + lichess usernames
  token: string;       // Lichess personal access token (for explorer API)
}

export type GameTaskTrackingWorkerInbound = StartGameTaskTrackingRequest;

// Outbound
export interface GameTaskTrackingProgressMessage {
  type: "GAME_TASK_PROGRESS";
  processedGames: number;
  totalGames: number;
  currentGameId: string;
}

export interface GameTaskTrackingCompleteMessage {
  type: "GAME_TASK_COMPLETE";
}

export interface GameTaskTrackingErrorMessage {
  type: "GAME_TASK_ERROR";
  error: string;
}

export type GameTaskTrackingWorkerOutbound =
  | GameTaskTrackingProgressMessage
  | GameTaskTrackingCompleteMessage
  | GameTaskTrackingErrorMessage;
```

### 3.2 Worker Startup (`src/workers/GameTaskTrackingWorker.ts`)

```
self.onmessage = async (event) => {
  const { usernames, token } = event.data;
  // Run the algorithm (section 2) posting progress after each game
  // Post GAME_TASK_COMPLETE when done
  // Post GAME_TASK_ERROR if an exception is thrown
}
```

The worker imports `PositionUpdateTaskClient`, `SavedGameClient`, `GradualRepertoireClient`, and `matchGameToGRB` directly (all are synchronous Dexie calls compatible with worker context).

---

## 4. New Page: Game Task Tracking Page

**Route:** `/game-task-tracking`  
**Page component:** `src/pages/GameTaskTrackingPage.tsx`  
**Registered in** `src/App.tsx` alongside the other GRB routes.

### 4.1 UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Game Update Task Tracking                                    │
│                                                              │
│  [Run Game Update Task Checking Algorithm]  (PrimeReact      │
│                                             Button)          │
│                                                              │
│  Progress bar / status line (shown while worker is running)  │
│  e.g. "Processing game 12 of 47..."                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Date │ Opponent │ GRB │ FEN │ Coverage │ Status      │    │
│  │ ...  │ ...      │ ... │ ... │ 62%      │ In Progress │    │
│  │ ...  │ ...      │ ... │ ... │ 100%     │ Complete    │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

Use `DataTable` + `Column` from PrimeReact, consistent with `GRBDiff.tsx`.

### 4.2 Component State

```typescript
const [tasks, setTasks] = useState<PositionUpdateTask[]>([]);
const [running, setRunning] = useState(false);
const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
const workerRef = useRef<Worker | null>(null);
const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

### 4.3 Polling Strategy

- On mount, load initial task records: `PositionUpdateTaskClient.getRecent(50)` → `setTasks`.
- When the algorithm is running, set up a `setInterval` that fires every **1 000 ms** and re-queries `PositionUpdateTaskClient.getRecent(50)`, updating `tasks` in state. This causes the `DataTable` to refresh automatically.
- Clear the interval when the worker posts `GAME_TASK_COMPLETE` or `GAME_TASK_ERROR`, or when the component unmounts.

### 4.4 Starting the Worker

```typescript
const handleRunAlgorithm = () => {
  if (running) return;
  setRunning(true);

  const worker = new Worker(
    new URL("../workers/GameTaskTrackingWorker.ts", import.meta.url),
    { type: "module" }
  );
  workerRef.current = worker;

  worker.onmessage = (e: MessageEvent<GameTaskTrackingWorkerOutbound>) => {
    if (e.data.type === "GAME_TASK_PROGRESS") {
      setProgress({ processed: e.data.processedGames, total: e.data.totalGames });
    } else if (
      e.data.type === "GAME_TASK_COMPLETE" ||
      e.data.type === "GAME_TASK_ERROR"
    ) {
      setRunning(false);
      setProgress(null);
      worker.terminate();
    }
  };

  // Start 1-second poll
  pollIntervalRef.current = setInterval(async () => {
    const updated = await PositionUpdateTaskClient.getRecent(50);
    setTasks(updated);
  }, 1000);

  worker.postMessage({
    type: "START_GAME_TASK_TRACKING",
    usernames,
    token,
  } satisfies StartGameTaskTrackingRequest);
};
```

Terminate the worker and clear the interval in a `useEffect` cleanup.

### 4.5 DataTable Columns

| Column | Field | Notes |
|---|---|---|
| Date | `createdAt` | Formatted as `toLocaleDateString()` |
| Game | `gameId` | Truncated; links to saved game if available |
| GRB | `grbId` | Resolved to GRB name via lookup map |
| Position | `latestFEN` | Rendered with `TinyFENDisplay` |
| Coverage | `coverage` | Show `—` if null, otherwise `{n}%` |
| Status | `completionStatus` | `Complete` (green tag) / `In Progress` (yellow tag) |
| Actions | — | Copy FEN button (see 4.6) |

### 4.6 Copy FEN Button

Each row includes a small `Button` in the Actions column that copies `latestFEN` to the clipboard and shows a green success toast.

**Implementation:**

```typescript
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

const toast = useRef<Toast>(null);

const copyFEN = (fen: string) => {
  navigator.clipboard.writeText(fen).then(() => {
    toast.current?.show({
      severity: 'success',
      summary: 'FEN Copied',
      detail: fen,
      life: 2500,
    });
  });
};

// In JSX, place before the DataTable:
<Toast ref={toast} />

// Column body template:
const copyFENTemplate = (rowData: PositionUpdateTask) => (
  <Button
    icon="pi pi-copy"
    size="small"
    text
    tooltip="Copy FEN"
    tooltipOptions={{ position: 'top' }}
    onClick={() => copyFEN(rowData.latestFEN)}
  />
);
```

The `Toast` component must be placed at the top level of the page component (not inside the `DataTable`). The `navigator.clipboard` API is available in all modern browsers when the page is served over HTTPS or localhost.

---

## 5. GradualRepertoireBuilder FEN Jump Input

### 5.1 Overview

Add a FEN input field to `src/components/GradualRepertoireBuilder.tsx` that lets the user paste any FEN string and immediately navigate the builder to the matching position within the currently loaded GRB repertoire.

### 5.2 UI Placement

Place the input in the `GradualRepertoireBuilder` component, visible once a repertoire has been selected (i.e. `setupResult` is not null, same guard used before rendering `SinglePositionBuilder`). Position it above the board area, in a compact inline layout:

```
┌────────────────────────────────────────────────────────┐
│  Jump to FEN:  [____________________________________]  │
│                [InputText]              [Go] (Button)  │
└────────────────────────────────────────────────────────┘
```

### 5.3 State & Logic

Add local state to `GradualRepertoireBuilder`:

```typescript
const [fenInput, setFenInput] = useState('');
```

On clicking **Go** (or pressing Enter in the input), resolve the FEN to a sequence of SAN moves relative to the GRB's `startingFEN`, then call `setInitialMoves` from the store to navigate the builder to that position.

**Resolution algorithm:**

1. Validate the FEN with `new Chess(fenInput)` — catch and show an inline error message if invalid.
2. Normalise both the input FEN and candidate positions (strip halfmove clock and fullmove number, keeping only the first 4 space-separated tokens — same `normalizePosition` helper already used in `matchGameToGRB.ts`).
3. Walk the GRB's `lines` (arrays of SAN moves from `startingFEN`) using `chess.js` to replay each line and check if any intermediate position normalises to the input FEN.
4. If a match is found, extract the SAN move sequence up to (but not including) that position and pass it to `setInitialMoves(moves)`.
5. If no match is found within any line, show an inline error: *"Position not found in this repertoire."*

```typescript
const handleFENJump = () => {
  const normalizePos = (fen: string) => fen.split(' ').slice(0, 4).join(' ');
  let targetNorm: string;
  try {
    const testChess = new Chess(fenInput.trim());
    targetNorm = normalizePos(testChess.fen());
  } catch {
    setFenError('Invalid FEN.');
    return;
  }

  for (const line of setupResult.lines) {
    const chess = new Chess(setupResult.startingFEN);
    const movesPlayed: string[] = [];
    for (const san of line) {
      if (normalizePos(chess.fen()) === targetNorm) {
        setInitialMoves([...movesPlayed]);
        setFenInput('');
        setFenError(null);
        return;
      }
      try { chess.move(san); } catch { break; }
      movesPlayed.push(san);
    }
    // Also check the final position of the line
    if (normalizePos(chess.fen()) === targetNorm) {
      setInitialMoves([...movesPlayed]);
      setFenInput('');
      setFenError(null);
      return;
    }
  }
  setFenError('Position not found in this repertoire.');
};
```

### 5.4 Component Changes Summary

| Change | Details |
|---|---|
| New state | `fenInput: string`, `fenError: string \| null` |
| New handler | `handleFENJump()` — validates, resolves, calls `setInitialMoves` |
| JSX addition | `InputText` + `Button` rendered when `setupResult !== null` |
| Imports | `InputText` from `primereact/inputtext`; `Chess` already imported |

The `GradualRepertoireBuilderProps` interface and `GradualRepertoireBuilderPage.tsx` require **no changes** — `initialMoves` is already the mechanism used to jump to a position, so reusing `setInitialMoves` from the store is sufficient.

---

## 6. Navigation Integration

Add a nav entry for the new page in `src/App.tsx` alongside the existing GRB entries:

```typescript
import GameTaskTrackingPage from "./pages/GameTaskTrackingPage";
// ...
<Route path="/game-task-tracking" element={<GameTaskTrackingPage />} />
```

And add a nav button in the home page / side-nav area (wherever `/grb-diff` is currently linked):

```typescript
window.location.hash = "#/game-task-tracking";
```

---

## 7. File Checklist

| File | Action |
|---|---|
| `src/database/types.ts` | Add `PositionUpdateTask` interface |
| `src/database/db.ts` | Add version 5 schema; add table declaration |
| `src/database/PositionUpdateTaskClient.ts` | **New file** |
| `src/database/index.ts` | Export new client and type |
| `src/workers/gameTaskTrackingTypes.ts` | **New file** — message types |
| `src/workers/GameTaskTrackingWorker.ts` | **New file** — Web Worker |
| `src/pages/GameTaskTrackingPage.tsx` | **New file** — page wrapper |
| `src/App.tsx` | Add route + nav entry |

---

## 8. Key Design Decisions

- **Idempotent algorithm**: because the algorithm checks for an existing record before creating one, it can be re-run safely at any time without duplicating rows.
- **Coverage threshold**: 90% is the threshold for `completionStatus = true`. This mirrors the GRB's intent to allow some variation while still treating a position as "covered."
- **Worker isolation**: the Dexie `db` singleton is imported inside the worker. Dexie supports concurrent access from multiple contexts to the same IndexedDB database, so the main thread and the worker can both read/write safely.
- **1-second poll rather than worker postMessage for table data**: this keeps the worker focused on computation and lets the main thread own all UI state. The poll also handles the case where the user navigates away and back mid-run.
- **No re-analysis of complete tasks**: once `completionStatus = true`, the algorithm skips the record entirely on subsequent runs, keeping the algorithm fast.
