import refreshGames from './integrations/chess.com';
import {getItemGZIP, setItemGZIP} from './storage';

function loadCachedData() {

    const properties =
        [ "analysisDatabase",
            "repertoire",
            "games",
            "playerName",
            "repertoireList",
            "matchingMoves",
            "userLeftBookOnly",
            "repertoireChoice"
        ];

    const justStrings = [ "repertoireChoice", "playerName"];

    let returnObject = {};
    properties.forEach(property => {
        console.log("attempting to process", property)
        if (localStorage.getItem(property)) {
            returnObject[property + "Storage"] =
                getItemGZIP(property, justStrings.indexOf(property) !== -1);
        }
    });

    return returnObject;
}

export default loadCachedData;