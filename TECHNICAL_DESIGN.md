# Technical Design

This document will explain some technical features and decisions used to create this application.

## Language

This project uses modern JavaScript and targets the web platform. This allows easy access from any platform with a web browser.

## Frameworks and Libraries

This project makes use of many libraries and frameworks in order to keep focus on the business logic.

### React

Modern React was the primary framework used in this application. This project did not use class components or higher-order components, preferring functional components and hooks.

The project needed many hooks due to the third party libraries that were not written in React. `useEffect` worked well for these libraries.

Standard companion libraries:
- Webpack for packaging
- Jest for unit tests
- Babel for "transpilation"

While years ago I would have used Redux for this application, the `useReducer` hook and simple `useState` hooks were enough to power this application.

### UI Toolkit

This project uses [Material V3 web components](https://m3.material.io/develop/web). This allows things like `<md-text-button>` instead of a `<button>` with manual styling. The form for the application came together quickly and looks polished.

### Chessboard.js

One decision was to avoid re-implementing any chess game logic or chess board display logic. These problems have been solved many times, and implementing them again would not have added any business value. For display, this application uses [https://www.chessboardjs.com/](Chessboard.js). This library makes use of jQuery, so it's a different style than the main React codebase. This required a combination of `useEffect` and occasional `setTimeout` calls to allow the DOM rendering sequence that the library expected. This was not a huge problem and the application runs well, but one opportunity for future development would be to re-write this library in React.

### Chess.js

This application uses the [Chess.js library](https://github.com/jhlywa/chess.js/), a chess game logic library written in TypeScript. While this library did not produce any bugs during development, it was a bit slow. The application ended up performing analysis in a web worker (explained more below) and caching it as chess.js could not perform the analysis for this application quickly enough for the rendering loop. This was overall not a problem, but analysis speed could be improved by using a faster library such as [the lichess Scala library](https://github.com/veloce/scalachessjs) or a lower-level one such as [this Rust library](https://docs.rs/chess/latest/chess/) compiled to WebAssembly.

## Deployment

This application used the GitHub pages feature to make the application available at [https://macacollins.github.io/book-it/](https://macacollins.github.io/book-it/). The GitHub workflow feature allows the application to run all tests, including coverage, before automatically building and deploying the application. All the developer has to do is commit and push to the Git repository main branch, and the workflow will run and eventually deploy to GitHub pages. 

[History of GitHub workflow runs](https://github.com/macacollins/book-it/actions/workflows/webpack.yml)

This was a good fit for a single-developer project, but with a team we would have a variety of workflows and only run the actual deployment after merge requests are approved and merged to the `main` branch.

## Browser APIs

This application used a few interesting browser APIs to make the application more responsive and allow storing all of the data in the browser.

### IndexedDB

Browsers nowadays ship with an entire database, called [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). This application was storing its data in `localStorage`, but quickly ran into size limits. A switch to IndexedDB using the [Dexie library](https://dexie.org/) allowed us to store enough data to power the application locally in the browser. As it is currently, the application uses IndexedDB as a simple key-value store and maintains the entire cache in the JavaScript side. This is pretty fast, but there might be an opportunity to restructure the IndexedDB usage if the app would benefit from relational database features.

### Web Workers

Web Workers let you to run JavaScript code in a background thread, allowing the UI to be more responsive and still conduct processing in the background. This application performs [the primary analysis](https://github.com/macacollins/book-it/blob/main/src/analysis/calculateAnalysis.js), determining which moves the user should practice, in a Web Worker as it takes too long to perform in the render loop. As the web worker processes games and determines what position to show and the red / green arrows, it sends incremental results to the main process so that the user can use the application.

### Media Queries

To support dark mode, the browser provides `window.matchMedia` which allows you to respond to dark mode preferences in JavaScript. This lets us match the operating system preference for dark mode programatically. 

## Data Formats

### PGN

[PGN, or portable game notation](https://en.wikipedia.org/wiki/Portable_Game_Notation), is the standard computer representation of a chess game. It is a list of the moves played by each side in something called  For this application, PGN data for your games is retrieved directly from [chess.com's free API](https://www.chess.com/news/view/published-data-api). 

PGN is also used for the "repertoire", or set of desired starting moves for the chess games. If you upload your own PGN file with a list of the opening lines you want to play, this application will check them against your games and show you the differences.

### FEN

[FEN, or Forsyth Edwards Notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation), is used to represent a single position in a chess game. This is the lingua franca of chess positions. FEN is used to save chess positions in this application's internal memory representation. FEN also powers the Lichess and Chessable links that take you to relevant pages on those other sites.


