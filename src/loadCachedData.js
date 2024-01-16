import refreshGames from './integrations/chess.com';
import {getItemGZIP, setItemGZIP} from './storage';

async function loadCachedData() {

    const properties =
        [ "analysisDatabase",
            "repertoire",
            "games",
            "playerName",
            "repertoireList",
            "matchingMoves",
            "userLeftBookOnly",
            "repertoireChoice",
            "activeTab"
        ];

    let returnObject = {};
    for (let property of properties) {
        console.log("attempting to process", property)
        if (await getItemGZIP(property)) {
            let gzipped =
                await getItemGZIP(property);
            returnObject[property + "Storage"] = gzipped;
        }
    }

    return returnObject;
}

export default loadCachedData;