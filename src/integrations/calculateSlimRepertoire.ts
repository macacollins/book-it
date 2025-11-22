// This function takes in a list of games in PGN format
import { Chess } from "chess.js";
import pgnParser, { ParsedPGN } from "pgn-parser";

const startingFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function calculateSlimRepertoire(lines: string | string[], repertoireName: string, setComments: any): Record<string, string[]> {
  let parsed: ParsedPGN[] = [];
  // let allLines = new Chess();
  
  const parseStartTime = performance.now();
  try {
    // allLines.loadPgn(lines.join("\n"));
    parsed = pgnParser.parse(Array.isArray(lines) ? lines.join("\n") : lines);
    // console.log("Got full single pgn", parsed);
  } catch (e) {
    console.log(
      "Encountered e while parsing all lines. On to the next one.",
      e,
    );
  }
  const parseEndTime = performance.now();
  const parseTime = parseEndTime - parseStartTime;
  console.log(`PGN parsing time: ${parseTime.toFixed(2)}ms (${parsed.length} games)`);


  // { [fen]: [ line, line, line, line ] }
  // This object uses FEN strings, which is a string representation of a chess position, as keys
  // https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
  // Each position has a corresponding value which is a list of the PGN lines
  // We use this to calculate which moves are expected in a given position based on the repertoire
  let fenRepo: Record<string, string[]> = {};

  // Process each line of the new repertoire with a for loop
  // Each line is one set of moves in PGN notation, such as 1. e4 e5 2. Nf3 3. Nc6
  // https://en.wikipedia.org/wiki/Portable_Game_Notation
  //
  // Use the chess.com library to generate the FEN at each position in the game,
  // then put the FEN and line in the fenRepo map. This allows us to quickly pull up
  // the repertoire lines for the given position.
  let gameIndex = 0;
  for (let game of parsed) {
    const gameStartTime = performance.now();

    // Create a new Chess.js game so that we can play the moves one by one
    // NOTE: The undo() function in Chess.js did not generate FEN in the expected fashion
    // Which is why we play it again here
    let stepByStepHistory = new Chess();

    // For each move in the game's history, play it on the board
    for (let moveIndex = 0; moveIndex < game.moves.length; moveIndex++) {
      const historyMove = game.moves[moveIndex];

      if (moveIndex === 0 && historyMove.comments && setComments) {
        if (fenRepo[startingFEN]) {
          if (!fenRepo[startingFEN].includes(historyMove.move)) {
            fenRepo[startingFEN].push(historyMove.move);
          }
        } else {
          fenRepo[startingFEN] = [historyMove.move];
        }
      }
      
      try {
        stepByStepHistory.move(historyMove.move, { strict: false });
      } catch (e) {
        // oops
        console.log("Got an error", e);
        continue;
      }

      const trimmedFEN = stepByStepHistory.fen();

      if (historyMove.comments && setComments) {
        setComments(trimmedFEN, repertoireName, historyMove.comments);
      }

      // Get the next move in the game (if it exists)
      const nextMoveIndex = moveIndex + 1;
      if (nextMoveIndex < game.moves.length) {
        const nextMove = game.moves[nextMoveIndex].move;
        
        // Add the next move to fenRepo
        if (fenRepo[trimmedFEN]) {
          if (!fenRepo[trimmedFEN].includes(nextMove)) {
            fenRepo[trimmedFEN].push(nextMove);
          }
        } else {
          fenRepo[trimmedFEN] = [nextMove];
        }
      }
    }
    
    if (gameIndex % 100 === 0) {
      const gameEndTime = performance.now();
      const gameTime = gameEndTime - gameStartTime;
      console.log(`Game ${gameIndex + 1}: ${gameTime.toFixed(2)}ms (${game.moves.length} moves)`);
      gameIndex++;
    }
  }
  return fenRepo;
}
