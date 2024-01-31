import {Chess} from "chess.js";

export function getRepertoireMove(gameCache: { [index: string] : Chess }, index: number): (newValue: string) => string {
    return line => {
        // This variable gets the rest of the moves from the line after the current position
        let maybeMoves;

        if (gameCache[line]) {

            let cachedGame = gameCache[line];
            maybeMoves = cachedGame.history().slice(index, index + 1);

        } else {
            let tempGame = new Chess();
            tempGame.loadPgn(line)

            // Cache the chess.com game in memory to avoid re-calculation
            gameCache[line] = tempGame;

            maybeMoves = tempGame.history().slice(index, index + 1);
        }

        if (maybeMoves && maybeMoves.length > 0) {
            // console.log("")
            return maybeMoves[0];
        } else {
            // If there was not another move for whatever reason
            return "oops"
        }
    };
}