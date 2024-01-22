import {setItemDexie} from "../storage";
import {calculateRepertoire} from "./calculateRepertoire";

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

    let fenRepo = calculateRepertoire(lines);
    console.log("Setting current repertoire to new repertoire ", newRepertoireNameField);

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