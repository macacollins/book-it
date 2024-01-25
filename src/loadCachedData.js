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
        // console.log("attempting to process", property)
        let value = await getItemDexie(property)
        if (value) {
            returnObject[property + "Storage"] = value;
        }
    }

    return returnObject;
}

export default loadCachedData;