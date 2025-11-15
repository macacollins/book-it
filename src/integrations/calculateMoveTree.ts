// This function takes in a list of games in PGN format
import { Chess } from "chess.js";
import pgnParser, { ParsedPGN } from "pgn-parser";
import { addMoveNode, addStartNode, findStartNode, MoveTree } from "../types/MoveTree";

export function calculateMoveTree(lines: string | string[], name: string): MoveTree {
  let parsed: ParsedPGN[] = [];
  // let allLines = new Chess();
  try {
    // allLines.loadPgn(lines.join("\n"));
    parsed = pgnParser.parse(Array.isArray(lines) ? lines.join("\n") : lines);
    // console.log("Got full single pgn", parsed);

    return calculateMoveTreeFromParsedPGN(parsed, name);
  } catch (e) {
    console.log(
      "Encountered e while parsing all lines. On to the next one.",
      e,
    );

    return {
      name: "Could not parse PGN",
      nodes: [],
      headers: {
      }
    }
  }
}

export function calculateMoveTreeFromParsedPGN(parsed: ParsedPGN[], name: string): MoveTree {
  // { [fen]: [ line, line, line, line ] }
  // This object uses FEN strings, which is a string representation of a chess position, as keys
  // https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
  // Each position has a corresponding value which is a list of the PGN lines
  // We use this to calculate which moves are expected in a given position based on the repertoire
  let fenRepo: MoveTree = {
    name,
    nodes: [],
    headers: {
    }
  };
  const startingFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  fenRepo = addStartNode(fenRepo, startingFEN);

  // Process each line of the new repertoire with a for loop
  // Each line is one set of moves in PGN notation, such as 1. e4 e5 2. Nf3 3. Nc6
  // https://en.wikipedia.org/wiki/Portable_Game_Notation
  //
  // Use the chess.com library to generate the FEN at each position in the game,
  // then put the FEN and line in the fenRepo map. This allows us to quickly pull up
  // the repertoire lines for the given position.
  for (let game of parsed) {
    // Create a new Chess.js game so that we can play the moves one by one
    // NOTE: The undo() function in Chess.js did not generate FEN in the expected fashion
    // Which is why we play it again here
    let stepByStepHistory = new Chess();
    let lastFEN = startingFEN;

    // For each move in the game's history, play it on the board
    for (let historyMove of game.moves) {
      try {
        stepByStepHistory.move(historyMove.move, { strict: false });
      } catch (e) {
        // oops
        console.log("Got an error", e);
        continue;
      }

      const trimmedFEN = stepByStepHistory.fen();

      // Real format is [{"text":" The ambitious Sicilian Defense! Black is fighting for the center but from the side, without going for a symmetrical pawn structure. "}]
      const notes = historyMove?.comments?.length ? (historyMove.comments as unknown as RealPGNComment[]).map(a => a.text.trim()).join("\n") : "";

      fenRepo = addMoveNode(fenRepo, lastFEN, historyMove.move, trimmedFEN, notes);

      lastFEN = trimmedFEN;
    }
  }
  return fenRepo;
}

interface RealPGNComment {
  text: string;
}