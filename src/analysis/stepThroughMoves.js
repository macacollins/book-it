import {Chess} from "chess.js";
import {getRepertoireMove} from "./getRepertoireMove";
import generateArrowConfig from "./generateArrowConfig";

export function stepThroughMoves(mainChessGame, repertoire, analysis) {

    let chessGameStepByStep = new Chess();
    let checkFurther = false;
    const gameCache = {};
    let repertoireMoves = [];

    let lastFEN = '';

    // Play moves until you find a position that's not in the repertoire
    for (let index = 0; index < mainChessGame.history().length; index++) {

        // Save the last FEN so that we can display it later
        lastFEN = chessGameStepByStep.fen();
        // Get a chess.com move that we can add a red arrow for it later
        let move_made = chessGameStepByStep.move(mainChessGame.history()[index]);

        let fen = chessGameStepByStep.fen();

        // If the position was in the repertoire, mark that we found a position in it
        if (repertoire[fen]) {
            // recognized at least one
            checkFurther = true;
        }
        // If we matched once, but don't match the current position, we have left the repertoire
        // Save the position details, add the arrows, etc. and break from the loop
        if (checkFurther && !repertoire[fen]) {
            //console.log("Couldn't find ", chess_game_step_by_step.ascii())
            let lines = repertoire[lastFEN] || [];
            analysis.finalMoveIndex = index;

            // console.log("Lines are", lines);
            let movesFromRepertoire = lines.map(getRepertoireMove(gameCache, index));

            // Take out any "oops" that may have gotten in
            // TODO refactor this code so that this is not necessary
            repertoireMoves = [...(movesFromRepertoire.filter(moveName => moveName !== "oops"))];

            analysis.foundIntersection = true;

            // This next section adds a red arrow for the move that left book
            let arrowConfig = generateArrowConfig(move_made, analysis.invert_board, "red");

            analysis.arrows.push(arrowConfig)

            break;
        }
    }
    return {lastFEN, repertoireMoves};
}