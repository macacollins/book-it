import {getItemDexie, getAllGames} from './storage';

async function loadCachedData() {

    const properties =
        ["analysisDatabase",
            "repertoire",
            "playerName",
            "lichessPlayerName",
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

    const games = await getAllGames();

    return {...returnObject, gamesStorage: games};
}

export default loadCachedData;