import AnalysisDatabase from "../types/AnalysisDatabase";
import Game from "../types/Game";

export default function findTopOpenings(games: Game[], analysisDatabase: AnalysisDatabase) {
    let openingsCounts: {
        [openingFamilyName: string] : number
    } = {};

    games.forEach(game => {
        const analysis = analysisDatabase[game.url];

        if (analysis) {
            if (openingsCounts[analysis.openingFamily]) {
                openingsCounts[analysis.openingFamily] = openingsCounts[analysis.openingFamily] + 1;
            } else {
                openingsCounts[analysis.openingFamily] = 1;
            }
        }
    })

    let openingList: {opening: string, count: number}[] = [];
    Object.keys(openingsCounts).forEach(key => {
        openingList.push({opening: key, count: openingsCounts[key]});
    })

    // Custom function to calculate a sorting criterion
    function customSort(item: { count: number}) {
        // For example, sorting based on the 'value' property
        return item.count;
    }

    // Sort the array based on the result of the custom function
    const result = openingList.sort(function (a, b) {
        return customSort(a) - customSort(b);
    }).reverse();

    // console.log("openingsCounts", openingsCounts);
    // console.log("openingList", openingList);
    // console.log("results", result);

    return result;
}