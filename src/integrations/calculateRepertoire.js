// This function takes in a list of games in PGN format
import {Chess} from "chess.js";
import pgnParser, { ParsedPGN } from 'pgn-parser';


export function calculateRepertoire(lines) {

    let linesArray =
        typeof lines === 'string' ? lines.split("\n") :
        lines.map ? lines
            : [];

    let parsed = [];
    // let allLines = new Chess();
    try {
        // allLines.loadPgn(lines.join("\n"));
        parsed = pgnParser.parse(lines.join("\n"));
        // console.log("Got full single pgn", parsed);
    } catch (e) {
        console.log("Encountered e while parsing all lines. On to the next one.", e);
    }

    // { [fen]: [ line, line, line, line ] }
    // This object uses FEN strings, which is a string representation of a chess position, as keys
    // https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
    // Each position has a corresponding value which is a list of the PGN lines
    // We use this to calculate which moves are expected in a given position based on the repertoire
    let fenRepo = {};

    // Process each line of the new repertoire with a for loop
    // Each line is one set of moves in PGN notation, such as 1. e4 e5 2. Nf3 3. Nc6
    // https://en.wikipedia.org/wiki/Portable_Game_Notation
    //
    // Use the chess.com library to generate the FEN at each position in the game,
    // then put the FEN and line in the fenRepo map. This allows us to quickly pull up
    // the repertoire lines for the given position.
    for (let game of parsed) {

        // Load up the game using the Chess.js library
        // This allows us to navigate through the game in JS code
        let fullGame = new Chess();

        // Create a new Chess.js game so that we can play the moves one by one
        // NOTE: The undo() function in Chess.js did not generate FEN in the expected fashion
        // Which is why we play it again here
        let stepByStepHistory = new Chess();

        // For each move in the game's history, play it on the board
        for (let historyMove of game.moves) {

            try {
                stepByStepHistory.move(historyMove.move);
            } catch (e) {
                // oops
                console.log("Got an error", e);
                continue;
            }
            
            const trimmedFEN = stepByStepHistory.fen();

            // Add the result to fenRepo
            if (fenRepo[trimmedFEN]) {
                fenRepo[trimmedFEN].push(rePGNLine(game));
            } else {
                fenRepo[trimmedFEN] = [rePGNLine(game)];
            }
        }

    }
    return fenRepo;
}


function rePGNLine(parsedPgn) {
    let currentNumber = 1;
    let fullPGN = '1.';
    for (let move of parsedPgn.moves) {
        if (typeof move.move_number === "undefined") {
            fullPGN = `${fullPGN} ${move.move}`;
        } else if (move.move_number !== currentNumber) {
            fullPGN = `${fullPGN} ${move.move_number}. ${move.move}`;
            currentNumber = move.move_number;
        } else {
            fullPGN = `${fullPGN} ${move.move}`;
        }
    }

    // console.log("Returning pgn " + fullPGN);

    return fullPGN;
}