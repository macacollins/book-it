import calculateAnalysis from "./calculateAnalysis";

export default async function analyzeGames(message, inProgressListener, finalListener){
    // console.log("Starting to work", message)
    // { data: { analysisDatabase, repertoire, games, playerName } }
    // This format comes from the web worker message format
    let {data: {analysisDatabase, repertoire, games, playerName}} = message;
    let currentAnalysisDatabase = typeof analysisDatabase === "object" ? analysisDatabase : {};

    if (typeof repertoire !== "object" || Object.keys(repertoire).length === 0) {
        console.log("No repertoire to work with.")
        return;
    }

    console.log("Starting to process " + games.length + " games.");

    let i = 0;

    for (let game of games) {
        i++;

        // You can use the commented out code below to time the analysis
        // console.time("calculateAnalysis")
        let value = calculateAnalysis(currentAnalysisDatabase, repertoire, game, playerName);
        // console.timeEnd("calculateAnalysis")

        currentAnalysisDatabase[game.url] = value;

        // Every few items, post back the progress so the UI can use it
        if (i > 0 && i % 10 === 0) {

            inProgressListener(currentAnalysisDatabase);
        }
    }

    finalListener(currentAnalysisDatabase);

    console.log("Completed analysis");
}