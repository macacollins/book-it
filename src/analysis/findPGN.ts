
const startingRegex = /^(?:[0-9]+\.+)[a-hxp0-8\-+!?ONBKQR]*$/;

const additionalMovesRegex = /^(?:[0-9]+\.+)?(?:[a-hxp0-8\-+!?ONBKQR]+)?$/;

const punctuationRegex = /^(?:[0-9]+\.+)?(?:[a-hxp0-8\-+!?ONBKQR]+)?[\.'";,#!\?f]$/;

const trace = false;
// Input is the text, return value is a list of pgn fragments
export default function findPGN(input: string): string[]  {

    const tokens = input.split(" ");


    const resultsArray: string[] = [];
    let currentMoveString = "";

    for (const token of tokens) {
        trace && console.log("Processing token", token);;
        currentMoveString = processToken(token, currentMoveString, resultsArray);
    }

    if (currentMoveString !== "") {
        resultsArray.push(currentMoveString.trim());
    }

    return resultsArray;
}


function processToken(token: string, currentMoveString: string, allMovesArray: string[]) : string {
    let regexToUse = additionalMovesRegex;
    if (currentMoveString === "") {
        regexToUse = startingRegex;
    }

    let newCurrentMoveString = "";
    let matchResults = token.match(regexToUse)
    if (matchResults) {
        trace && console.log("Got a match", matchResults);
        // add on to the current pgn 
        newCurrentMoveString = currentMoveString + matchResults + " "
        //console.log("new current moves", newCurrentMoveString);

    } else if (token.length > 1 && token.match(punctuationRegex)) {
        trace && console.log("Trying it");
        return processToken(token.slice(0, -1), currentMoveString, allMovesArray);
    } else if (currentMoveString !== "") {
        trace && console.log("Found the first non-move token.", token)

        // line is done, add it to the list and keep going
        allMovesArray.push(currentMoveString.trim())
        newCurrentMoveString = "";
        //console.log("new current moves", newCurrentMoveString);
    } else {
        trace && console.log("No match", token);
    }

    return newCurrentMoveString;
}