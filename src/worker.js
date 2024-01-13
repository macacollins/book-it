import calculateAnalysis from "./analysis/calculateAnalysis";

console.log("Worker is running");

let receiver = async (message) => {
    // console.log("Starting to work", message)
    // { data: { analysisDatabase, repertoire, games, playerName } }
    let { data: { analysisDatabase, repertoire, games, playerName } } = message;
    let currentAnalysisDatabase = typeof analysisDatabase === "object" ? analysisDatabase : {};

    if (typeof repertoire !== "object" || Object.keys(repertoire).length === 0) {
        console.log("No repertoire to work with.")
        return;
    }

    console.log("Starting to process " + games.length + " games.");

    let i = 0;

    for (let game of games) {
        i++;

        console.time("calculateAnalysis")
        let value = calculateAnalysis(currentAnalysisDatabase, repertoire, game, playerName);
        console.timeEnd("calculateAnalysis")

        currentAnalysisDatabase[game.url] = value;

        if (i > 0 && i % 10 === 0) {

            console.log(i);
            message.target.postMessage({
                action: "SET_ANALYSIS_DATABASE",
                currentAnalysisDatabase: currentAnalysisDatabase
            });
        }
    }


};

/* eslint-disable no-restricted-globals */
self.onchange = receiver;
self.onmessage = receiver;

// export default {
//     onchange: receiver,
//     onmessage: receiver
// }