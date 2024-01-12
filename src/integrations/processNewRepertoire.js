import {Chess} from "chess.js";
import {setItemGZIP} from "../storage";

export default function processNewRepertoire(fileContents, {repertoire, setRepertoire, newRepertoireNameField, setNewRepertoireNameField, repertoireList, setRepertoireList}) {
    const lines = fileContents.split('\n');

    // { [fen]: [ line, line, line, line ] }
    let fenRepo = {};

    // Process each line in a for loop
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i].trim();

        // console.log(`Processing line ${i + 1}: ${currentLine}`);

        let this_chess = new Chess();
        this_chess.loadPgn(currentLine);

        // console.log(this_chess);

        let history = this_chess.history();

        let step_by_step_history = new Chess();

        for (let j = 0; j < history.length; j++) {

            step_by_step_history.move(history[j]);

            if (fenRepo[step_by_step_history.fen()]) {
                fenRepo[step_by_step_history.fen()].push(currentLine);
            } else {
                fenRepo[step_by_step_history.fen()] = [currentLine];
            }
        }


    }
    console.log("new repertoire name field is ", newRepertoireNameField);
    console.log("Setting current repertoire");

    const newRepertoire = {
        ...repertoire,
        [newRepertoireNameField]: fenRepo
    }
    setRepertoire(newRepertoire);
    setItemGZIP('repertoire', newRepertoire);

    const newRepertoireList = [
        ...repertoireList,
        newRepertoireNameField
    ]

    setRepertoireList(newRepertoireList);
    setItemGZIP('repertoireList', newRepertoireList);

    // setNewRepertoireNameField("");
}