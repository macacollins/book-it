import AnalysisDatabase from "../types/AnalysisDatabase";
import Game from "../types/Game";
import Repertoire from "../types/Repertoire";
import calculateAnalysis from "./calculateAnalysis";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface AnalyzeGamesExpectedMessage {
    data: InnerAnalyzeGamesExpectedMessage
}

export interface InnerAnalyzeGamesExpectedMessage {

    analysisDatabase: AnalysisDatabase, 
    repertoire: Repertoire, 
    games: Game[], 
    playerName: string
}

export default async function analyzeGames(
        message : AnalyzeGamesExpectedMessage, 
        inProgressListener: (value: AnalysisDatabase) => void, 
        finalListener: (value: AnalysisDatabase) => void){
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

    let index = 0;

    for (let game of games) {
        index++;

        // You can use the commented out code below to time the analysis
        // console.time("calculateAnalysis")
        let analysis = calculateAnalysis(currentAnalysisDatabase, repertoire, game, playerName);
        // console.timeEnd("calculateAnalysis")

        currentAnalysisDatabase[game.url] = analysis;
        // await delay(10);

        // Every few items, post back the progress so the UI can use it
        if (index > 0 && index % 10 === 0) {

            inProgressListener(currentAnalysisDatabase);
        }
    }

    finalListener(currentAnalysisDatabase);

    console.log("Completed analysis");
}