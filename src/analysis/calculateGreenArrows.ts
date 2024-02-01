
import {Chess} from "chess.js";
import generateArrowConfig from "./generateArrowConfig";
import { ArrowConfig } from "../types/ArrowConfig";

export function calculateGreenArrows(repertoireMoves: string[], lastFEN: string, invert_board: boolean): ArrowConfig[] {

    if (!repertoireMoves || !repertoireMoves.map) {
        return [];
    }

    let deduplicated = [...new Set(repertoireMoves)]

    let arrowConfigs : ArrowConfig[] = [];

    deduplicated.forEach(lastMove => {
        // Create a chess.com game at the position from the last FEN
        let clonedGame = new Chess(lastFEN);

        let move;
        try {
            // Get a chess.js move so that we can generate an arrow configuration
            move = clonedGame.move(lastMove);
        } catch (e) {
            console.info("e", e);
            console.info(lastMove);
            console.info(clonedGame.ascii());
            return;
        }

        // console.log("Got a move:", move);

        let arrowConfig = generateArrowConfig(move, invert_board, "green")

        arrowConfigs.push(arrowConfig);
    });

    // Add arrows for each of the repertoire moves
    return arrowConfigs
}