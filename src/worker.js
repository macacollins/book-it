import analyzeGames from "./analysis/analyzeGames";

console.log("Worker is running");

let receiver = async (message) => {

    function inProgressListener(currentAnalysisDatabase) {
        message.target.postMessage({
            action: "SET_ANALYSIS_DATABASE",
            currentAnalysisDatabase: currentAnalysisDatabase
        });
    }

    analyzeGames(message, inProgressListener, inProgressListener);
};

/* eslint-disable no-restricted-globals */
self.onchange = receiver;
self.onmessage = receiver;
