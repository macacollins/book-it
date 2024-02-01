import {Chess} from "chess.js";
import Game from "../types/Game";

export function calculateFinalPosition(lastFEN: string, foundIntersection: boolean, game: Game) {
    // console.time("new Chess(last_fen)")
    let chessGameDisplay = new Chess(lastFEN);
    // console.timeEnd("new Chess(last_fen)")

    // If there was no intersection, store the last position of the game
    // TODO consider showing the position after move 5
    if (!foundIntersection) {
        chessGameDisplay.loadPgn(game.pgn)
        //console.log("No intersection, loaded pgn instead");
    }
    return chessGameDisplay;
}