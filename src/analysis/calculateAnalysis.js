import {Chess} from 'chess.js'

function calculateAnalysis(analysisDatabase, repertoire, game, playerName) {

    if (analysisDatabase[game.url]) {
        // skip for now.r We can consider reworking this system when lines are more dynamically updated.
        // console.log(`Found analysis for ${game.url}`);
        return analysisDatabase
    }

    // console.log(`calculating analysis for ${game.url}`);

    //console.log(game.pgn);
    //console.log(new Chess());
    // this is single analysis for one game
    const analysis = {arrows: [], notes: "No notes found."}
    let chess_game = new Chess();
    chess_game.loadPgn(game.pgn);

    // TODO unhardcode
    let invert_board = chess_game.header().Black === playerName;

    let foundIntersection = false;


    let last_moves = [];
    let finalMoveIndex = 0;

    let chess_game_step_by_step = new Chess();
    let checkFurther = false;

    let last_fen = '';

    // don't recompute lines
    const gameCache = {};

    // attempt to rewind to last theory spot
    for (let i = 0; i < chess_game.history().length; i++) {

        last_fen = chess_game_step_by_step.fen();
        let move_made = chess_game_step_by_step.move(chess_game.history()[i]);

        let fen = chess_game_step_by_step.fen();

        if (repertoire[fen]) {
            // recognized at least one
            checkFurther = true;
        }
        if (checkFurther && !repertoire[fen]) {
            //console.log("Couldn't find ", chess_game_step_by_step.ascii())
            let lines = repertoire[last_fen] || [];
            finalMoveIndex = i;

            //console.log("Lines are", lines);
            let next_moves = lines.map(line => {
                let maybeMove;

                if (gameCache[line]) {

                    maybeMove = gameCache[line];
                    maybeMove = maybeMove.history().slice(i, i + 1);

                } else {
                    maybeMove = new Chess();
                    maybeMove.loadPgn(line)

                    gameCache[line] = maybeMove;

                    maybeMove = maybeMove.history().slice(i, i + 1);
                }

                if (maybeMove && maybeMove.length > 0) {
                    // console.log("")
                    return maybeMove[0];
                } else {
                    return "oops"
                }
            });


            last_moves = [...(next_moves.filter(moveName => moveName !== "oops"))];

            foundIntersection = true;
            analysis.foundIntersection = true;

            let [fromX, fromY] = square_to_coordinates(move_made.from);
            let [toX, toY] = square_to_coordinates(move_made.to);

            analysis.invert_board = invert_board;
            if (invert_board) {
                toY = 9 - toY;
                fromY = 9 - fromY;
                toX = 9 - toX;
                fromX = 9 - fromX;
            }

            let arrowConfig = {
                color: "red",
                fromX, fromY,
                destX: toX,
                destY: toY,
                san: move_made.san
            }

            analysis.arrows.push(arrowConfig)

            break;
        }
    }

    if (foundIntersection) {
        last_moves = [...new Set(last_moves)];
    }

    last_moves.forEach(last_move => {
        let cloned_game = new Chess(last_fen);

        let move;
        try {
            move = cloned_game.move(last_move);
        } catch (e) {
            console.log("e", e);
            console.log(last_move);
            console.log(cloned_game.ascii());
            return '';
        }

        // console.log("Got a move:", move);

        let [fromX, fromY] = square_to_coordinates(move.from);
        let [toX, toY] = square_to_coordinates(move.to);

        if (invert_board) {
            toY = 9 - toY;
            fromY = 9 - fromY;
            toX = 9 - toX;
            fromX = 9 - fromX;
        }

        const arrowConfig = {
            color: "green",
            fromX,
            fromY,
            destX: toX,
            destY: toY,
            moveSan: move.san
        }

        analysis.arrows.push(arrowConfig);
    });

    // console.time("new Chess(last_fen)")
    let chess_game_display = new Chess(last_fen);
    // console.timeEnd("new Chess(last_fen)")

    if (!foundIntersection) {
        chess_game_display.loadPgn(game.pgn)
        //console.log("No intersection, loaded pgn instead");
        last_fen = game.pgn
    }

    let advice = 'No advice found.';

    analysis.result = chess_game.header().Result

    analysis.finalMoveIndex = finalMoveIndex;
    analysis.fen_at_departure = chess_game_display.fen();
    analysis.you_left_book =
        foundIntersection && (
            chess_game_display.turn() === "w" ?
                chess_game.header().White === playerName :
                chess_game.header().Black === playerName);

    if (foundIntersection) {
        if (analysis.you_left_book) {
            advice = "You left book on this one. Study the lines from the repertoire."
        } else {
            advice = "They left book. Consider analyzing the move to get an idea of how to play against it."
        }
    } else {
        advice = "This position was not found in the repertoire. Consider expanding it for the below opening name."
    }

    // console.log("turn()", chess_game.turn());
    // console.log(game);

    analysis.advice = advice;
    analysis.displayFEN = chess_game_display.fen();

    analysis.headers = chess_game.header();

    const path = new URL(analysis.headers.ECOUrl).pathname;
    // Get the last path segment and replace hyphens with spaces
    const openingName = path.split('/').pop().replace(/-/g, ' ').replace(/[0-9].*/g, '');

    analysis.openingFamily = openingName;

    // console.log("Got analysis", analysis)

    analysisDatabase[game.url] = analysis;

    return analysis;
}


function square_to_coordinates(inputString) {
    // Check if the input string is valid

    // Extract letter and number
    const letter = inputString.charAt(0);
    const number = parseInt(inputString.charAt(1));

    // Calculate the index of the letter (a=1, b=2, ..., h=8)
    const letterIndex = letter.charCodeAt(0) - 'a'.charCodeAt(0) + 1;

    // Return a list with the calculated values
    return [letterIndex, number];
}

export default calculateAnalysis;