import refreshGames from './integrations/chess.com';


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
            if (justStrings.indexOf(property) === -1) {
                console.log("attempting to process", property)
                returnObject[property + "Storage"] = JSON.parse(localStorage.getItem(property));
            } else {
                returnObject[property + "Storage"] = localStorage.getItem(property);
            }
        }
    });

    return returnObject;
}

export default loadCachedData;