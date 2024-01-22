// This function takes in a list of games in PGN format
import {Chess} from "chess.js";

export function calculateRepertoire(lines) {

    let linesArray =
        typeof lines === 'string' ? lines.split("\n") :
        lines.map ? lines
            : [];

    console.log(lines);
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
    for (let line of linesArray) {
        const currentLine = line.trim();

        // Load up the game using the Chess.js library
        // This allows us to navigate through the game in JS code
        let this_chess = new Chess();
        this_chess.loadPgn(currentLine);

        // console.log(this_chess);

        // Get a list of all of the moves
        let history = this_chess.history();

        // Create a new Chess.js game so that we can play the moves one by one
        // NOTE: The undo() function in Chess.js did not generate FEN in the expected fashion
        // Which is why we play it again here
        let step_by_step_history = new Chess();

        // For each move in the game's history, play it on the board
        for (let historyMove of history) {

            step_by_step_history.move(historyMove);

            // Add the result to fenRepo
            if (fenRepo[step_by_step_history.fen()]) {
                fenRepo[step_by_step_history.fen()].push(currentLine);
            } else {
                fenRepo[step_by_step_history.fen()] = [currentLine];
            }
        }

    }
    return fenRepo;
}