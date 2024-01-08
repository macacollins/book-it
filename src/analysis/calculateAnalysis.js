import {Chess} from 'chess.js'

function calculateAnalysis(current_analysis, repertoire, games, setAnalysisDatabase, playerName) {

    let analysisDatabase = JSON.parse(localStorage.getItem("analysisDatabase")) || {};

    const repertoireChoice = localStorage.getItem("repertoireChoice");

    let thisRepertoire = repertoire[repertoireChoice];

    let moveArrow;

    function processSingleGame(game) {

        if (current_analysis[game.url]) {
            // skip for now. We can consider reworking this system when lines are more dynamically updated.
            // console.log(`Found analysis for ${game.url}`);
            return
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
        let last_position = new Chess();
        let checkFurther = false;

        // attempt to rewind to last theory spot
        for (let i = 0; i < chess_game.history().length; i++) {

            let move_made = chess_game_step_by_step.move(chess_game.history()[i]);

            let fen = chess_game_step_by_step.fen();

            if (thisRepertoire[fen]) {
                // recognized at least one
                checkFurther = true;
            }
            if (checkFurther && !thisRepertoire[fen]) {
                //console.log("Couldn't find ", chess_game_step_by_step.ascii())
                let lines = thisRepertoire[last_position.fen()] || [];
                finalMoveIndex = i;

                //console.log("Left at line", finalMoveIndex);
                //console.log("Lines are", lines);
                let next_moves = lines.map(line => {
                    let line_game = new Chess();
                    line_game.loadPgn(line);

                    let step_by_step_line = new Chess();
                    for (let j = 0; j < line_game.history().length; j++) {
                        let move = line_game.history()[j];

                        if (step_by_step_line.fen() === last_position.fen()) {
                            // we are there
                            last_moves.push(move);
                            break;

                        } else {
                            // make the move
                            step_by_step_line.move(move);
                        }

                    }
                });

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
                    destY: toY
                }

                analysis.arrows.push(arrowConfig)

                break;
            }

            last_position.move(chess_game.history()[i]);
        }

        if (foundIntersection) {
            last_moves = [...new Set(last_moves)];
        }

        let next_move_arrows = last_moves.map(last_move => {
            let cloned_game = new Chess(last_position.fen());

            let move = cloned_game.move(last_move);

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
                destY: toY
            }

            analysis.arrows.push(arrowConfig);
        });

        let chess_game_display = new Chess();

        for (let i = 0; i < finalMoveIndex; i++) {
            chess_game_display.move(last_position.history()[i]);
        }

        if (!foundIntersection) {
            chess_game_display.loadPgn(game.pgn)
            //console.log("No intersection, loaded pgn instead");
        }

        next_move_arrows.push(moveArrow);

        let advice = 'No advice found.';

        analysis.result = chess_game.header().Result

        analysis.fen_at_departure = chess_game_display.fen();
        analysis.you_left_book =
            chess_game_display.turn() === "w" ?
                chess_game.header().White === "***REMOVED***" :
                chess_game.header().Black === "***REMOVED***";

        if (analysis.you_left_book) {
            advice = "You left book on this one. Study the lines from the repertoire."
        } else {
            advice = "They left book. Consider analyzing the move to get an idea of how to play against it."
        }

        // console.log("turn()", chess_game.turn());
        // console.log(game);

        analysis.advice = advice;
        analysis.displayFEN = chess_game_display.fen();

        analysis.headers = chess_game.header();

        analysisDatabase[game.url] = analysis;


    }

    if (JSON.stringify(thisRepertoire) !== "{}") {
        if (games && games.length > 0) {

            if (analysisDatabase[games[0].url]) {
                return calculateAnalysis(current_analysis, repertoire, games.slice(1), setAnalysisDatabase, playerName);
            } else {
                processSingleGame(games[0]);

                if (analysisDatabase) {
                    console.log("Writing analysis to localStorage", analysisDatabase);

                    localStorage.setItem("analysisDatabase", JSON.stringify(analysisDatabase));
                    setAnalysisDatabase(analysisDatabase);


                    // the timeout ensures that we don't lock the top thread as badly
                    // however, it may be better to do this in a web worker or similar
                    setTimeout(() => {
                        calculateAnalysis(current_analysis, repertoire, games.slice(1), setAnalysisDatabase, playerName)
                    }, 1000);
                }
            }
        } else {
            // null case
            return;
        }
    }

    return analysisDatabase;
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