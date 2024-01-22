import {Chess} from "chess.js";
import {setItemDexie} from "../storage";

// This function takes in a list of games in PGN format
// Then creates a more convenient data structure to power the UI of the app
export default function processNewRepertoire(fileContents, {
    repertoire,
    setRepertoire,
    newRepertoireNameField,
    setNewRepertoireNameField,
    repertoireList,
    setRepertoireList
}) {
    const lines = fileContents.split('\n');

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
    for (let line of lines) {
        const currentLine = line.trim();

        // console.log(`Processing line ${i + 1}: ${currentLine}`);

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
    console.log("new repertoire name field is ", newRepertoireNameField);
    console.log("Setting current repertoire");

    // Add the repertoire to the repertoire map
    // "Repertoire" here is the fenRepo mapping of position -> list of moves in the repertoire
    const newRepertoire = {
        ...repertoire,
        [newRepertoireNameField]: fenRepo
    }
    setRepertoire(newRepertoire);
    setItemDexie('repertoire', newRepertoire);

    // Also add the name of the repertoire to the list of names
    // This powers the select box
    // TODO consider switching to Object.keys directly on the repertoire map
    const newRepertoireList = (repertoireList && repertoireList.length) ? [
        ...repertoireList,
        newRepertoireNameField
    ] : [ newRepertoireNameField ];

    setRepertoireList(newRepertoireList);
    setItemDexie('repertoireList', newRepertoireList);
}