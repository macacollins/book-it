import {Chess} from 'chess.js'
import {calculateAdvice} from "./calculateAdvice";
import {calculateOpeningFamily} from "./calculateOpeningFamily";
import {calculateFinalPosition} from "./calculateFinalPosition";
import {calculateGreenArrows} from "./calculateGreenArrows";
import {stepThroughMoves} from "./stepThroughMoves";
import AnalysisDatabase from '../types/AnalysisDatabase';
import Repertoire from '../types/Repertoire';
import Game from '../types/Game';
import AnalysisResult from '../types/AnalysisResult';
import { ArrowConfig } from '../types/ArrowConfig';

import pgnParser, { ParsedPGN } from 'pgn-parser';

// Calculate analysis:
// - Who left the repertoire, you or the opponent?
// - What was the position (in FEN) when the game left the repertoire?
// - Which arrows should we show to the user?
//   - Green if it is a repertoire move
//   - Red if it is the move that was played
// - What chess opening was used in this game?
// - Also cache chess.com headers and URL
function calculateAnalysis(analysisDatabase: AnalysisDatabase, repertoire: Repertoire, game: Game, playerName: string): AnalysisResult {

    // If we already have the game analyzed, just return
    if (analysisDatabase[game.url]) {
        // skip for now. We can consider reworking this system when analysis is dynamically updated.
        // console.log(`Found analysis for ${game.url}`);
        return analysisDatabase[game.url]
    }

    // Load the PGN for the game into Chess.js so we can manipulate it in JavaScript
    // let mainChessGame = new Chess();
    // mainChessGame.loadPgn(game.pgn);

    const [mainChessGame]: ParsedPGN[] = pgnParser.parse(game.pgn);

    if (!mainChessGame) {
        // we are in trouble
        throw "Broke"
    }

    const headers : { [ headerName: string ] : string } = {};
    for (let header of (mainChessGame.headers || [])) {
        headers[header.name] = header.value;
    }

    // this is single analysis for one game
    // For this application, we will invert the board if the player had the black pieces
    const invert_board = headers.Black === playerName;
    const { lastFEN, repertoireMoves, finalMoveIndex, foundIntersection, arrow } = 
            stepThroughMoves(mainChessGame, repertoire, invert_board);

    let finalArrows: ArrowConfig[] = calculateGreenArrows(repertoireMoves, lastFEN, invert_board);

    if (arrow) {
        finalArrows.push(arrow);
    }

    const chessGameDisplay = calculateFinalPosition(lastFEN, foundIntersection, game);

    // This is tricky, you left book if you were playing the color whose turn it was on departure
    const youLeftBook =
        foundIntersection && (
            chessGameDisplay.turn() === "w" ?
                headers.White === playerName :
                headers.Black === playerName);

    const advice = calculateAdvice(foundIntersection, youLeftBook);
    const displayFEN = chessGameDisplay.fen();

    const openingFamily = calculateOpeningFamily(headers);

    const result = headers.Result;

    return {
        invert_board,
        advice,
        displayFEN,
        openingFamily,
        headers,
        arrows: finalArrows,
        finalMoveIndex,
        result,
        youLeftBook,
        foundIntersection
    };
}

export default calculateAnalysis;