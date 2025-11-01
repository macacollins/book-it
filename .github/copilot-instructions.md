# Copilot Instructions for Book It! Chess Training App

## Architecture Overview

**Book It!** is a React-based chess training application that helps users practice opening repertoires based on their Chess.com or lichess games. The app identifies where users deviated from their chosen repertoire and provides targeted drills.

## Core Data Flow

The application revolves around three main data structures:

- **Repertoire**: `{ [fen: string]: string[] }` - Maps board positions to valid next moves
- **Games**: Array of Chess.com games with PGN, URL, and metadata
- **AnalysisDatabase**: Results of comparing games against repertoire to identify deviations

State flows: `App.tsx` → analysis worker → components. The worker (`src/worker.js`) processes game analysis asynchronously and posts progress updates back to the main thread.

## Storage System

Uses **Dexie.js** (IndexedDB wrapper) for persistence:

```javascript
// Primary storage functions in src/storage.js
await setItemDexie(key, value); // Save to IndexedDB
await getItemDexie(key); // Load from IndexedDB
```

Key storage patterns:

- `games` - Chess.com game data
- `book_lines` - Repertoire lines with chapter/line organization
- `analysisDatabase` - Cached analysis results
- Component state cached with keys like `ANNOTATIONS_BOARD_SIZE`, `CHANNELS`

## Key Components & Pages

### ChessBoard Component (`src/components/ChessBoard.tsx`)

Central component using Chessboard.js library. Loads external dependencies (jQuery, Chessboard.js) dynamically in `main.jsx`.

### Page Structure

- `pages/Drills.tsx` - Practice missed moves with frequency-based selection
- `pages/Results.tsx` - Review games with repertoire deviations
- `pages/Book.tsx` - Browse repertoire lines interactively
- `pages/Annotations.tsx` - Annotate games with local storage persistence

## Chess.com Integration

Located in `src/integrations/chess.com.js`:

- Fetches last 3 months of games via public API
- URL pattern: `https://api.chess.com/pub/player/{username}/games/{year}/{month}`
- Processes PGN data and stores with metadata

## Analysis Engine

### Core Analysis (`src/analysis/analyzeGames.ts`)

Compares games against repertoire to find deviations:

1. Steps through each game move-by-move
2. Checks if position exists in repertoire
3. Identifies where user played different move than repertoire
4. Creates analysis results with arrows and suggestions

### Worker Pattern

Analysis runs in Web Worker to prevent UI blocking:

```javascript
// In main thread
worker.postMessage({ analysisDatabase, repertoire, games, playerName });

// Worker responds with progress updates
worker.onmessage = (message) => {
  if (message.data.action === "SET_ANALYSIS_DATABASE") {
    // Update state with partial results
  }
};
```

## Testing Strategy

Uses Jest with React Testing Library:

- Mock Chessboard.js in tests: `jest.fn()` for `flip`, `move`, `position`
- Test files follow `*.test.{js,ts}` pattern
- Setup in `src/setupTests.js` imports `@testing-library/jest-dom`

## Development Commands

```bash
npm start          # Vite dev server
npm run build      # Production build
npm test           # Jest tests
```

## Build Configuration

- **Vite** for bundling (replaces Create React App)
- TypeScript enabled with `tsconfig.json`
- PWA support via `vite-plugin-pwa`
- Custom Vite config handles worker loading with `?worker` suffix

## PrimeReact UI Framework

Uses PrimeReact components extensively:

- `DataTable` for game lists
- `Button`, `InputText`, `Splitter` for UI
- Dark theme: `lara-dark-green`
- PrimeFlex for layout utilities

## Type System

Key TypeScript interfaces in `src/types/`:

- `Game.ts` - Chess.com game structure
- `Repertoire.ts` - Opening line definitions
- `AnalysisDatabase.ts` - Analysis results
- `AnalysisResult.ts` - Individual game analysis

## Navigation

Uses React Router v7 with HashRouter:

- Routes defined in `App.tsx`
- URL patterns: `/drills`, `/results`, `/book/{repertoire}/{chapter}`
- Channel-based routing for repertoire organization

## External Integrations

- **Chess.com API** - Game data import
- **Lichess** - Position analysis links
- **Chessable** - Opening education links
- **Chessboard.js** - Interactive board component

When making changes, ensure:

1. Worker communication stays async with progress updates
2. Dexie operations use async/await properly
3. Chess position validation through Chess.js library
4. PrimeReact component props follow library conventions
