import {getItemDexie} from './storage';

async function loadCachedData() {

    const properties =
        ["analysisDatabase",
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
        if (await getItemDexie(property)) {
            let gzipped =
                await getItemDexie(property);
            returnObject[property + "Storage"] = gzipped;
        }
    }

    return returnObject;
}

export default loadCachedData;