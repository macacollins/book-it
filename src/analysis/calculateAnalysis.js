import {Chess} from 'chess.js'
import {calculateAdvice} from "./calculateAdvice";
import {calculateOpeningFamily} from "./calculateOpeningFamily";
import {calculateFinalPosition} from "./calculateFinalPosition";
import {calculateGreenArrows} from "./calculateGreenArrows";
import {stepThroughMoves} from "./stepThroughMoves";

// Calculate analysis:
// - Who left the repertoire, you or the opponent?
// - What was the position (in FEN) when the game left the repertoire?
// - Which arrows should we show to the user?
//   - Green if it is a repertoire move
//   - Red if it is the move that was played
// - What chess opening was used in this game?
// - Also cache chess.com headers and URL
function calculateAnalysis(analysisDatabase, repertoire, game, playerName) {

    // If we already have the game analyzed, just return
    if (analysisDatabase[game.url]) {
        // skip for now. We can consider reworking this system when analysis is dynamically updated.
        // console.log(`Found analysis for ${game.url}`);
        return analysisDatabase
    }

    // Load the PGN for the game into Chess.js so we can manipulate it in JavaScript
    let mainChessGame = new Chess();
    mainChessGame.loadPgn(game.pgn);

    // this is single analysis for one game
    const analysis = {arrows: [], notes: "No notes found."}
    // For this application, we will invert the board if the player had the black pieces
    analysis.invert_board = mainChessGame.header().Black === playerName;
    const { lastFEN, repertoireMoves } = stepThroughMoves(mainChessGame, repertoire, analysis);

    analysis.arrows = [...analysis.arrows, ...calculateGreenArrows(repertoireMoves, lastFEN, analysis.invert_board)];

    const chessGameDisplay = calculateFinalPosition(lastFEN, analysis.foundIntersection, game);

    analysis.result = mainChessGame.header().Result

    // This is tricky, you left book if you were playing the color whose turn it was on departure
    analysis.youLeftBook =
        analysis.foundIntersection && (
            chessGameDisplay.turn() === "w" ?
                mainChessGame.header().White === playerName :
                mainChessGame.header().Black === playerName);

    analysis.advice = calculateAdvice(analysis);
    analysis.displayFEN = chessGameDisplay.fen();
    analysis.headers = mainChessGame.header();
    analysis.openingFamily = calculateOpeningFamily(analysis);

    return analysis;
}

export default calculateAnalysis;