
import {Chess} from "chess.js";
import generateArrowConfig from "./generateArrowConfig";

export function calculateGreenArrows(repertoireMoves, lastFEN, invert_board) {

    if (!repertoireMoves || !repertoireMoves.map) {
        return [];
    }

    let deduplicated = [...new Set(repertoireMoves)]

    // Add arrows for each of the repertoire moves
    return deduplicated.map(lastMove => {
        // Create a chess.com game at the position from the last FEN
        let clonedGame = new Chess(lastFEN);

        let move;
        try {
            // Get a chess.js move so that we can generate an arrow configuration
            move = clonedGame.move(lastMove);
        } catch (e) {
            console.log("e", e);
            console.log(lastMove);
            console.log(clonedGame.ascii());
            return '';
        }

        // console.log("Got a move:", move);

        let arrowConfig = generateArrowConfig(move, invert_board, "green")

        return arrowConfig;
    }).filter(arrow => arrow !== '');
}