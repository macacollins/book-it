import {Chess} from 'chess.js'

import getOpeningFamily from './getOpeningFamily';

import generateArrowConfig from './generateArrowConfig'

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

    // console.log(`calculating analysis for ${game.url}`);
    //console.log(game.pgn);
    //console.log(new Chess());
    // this is single analysis for one game
    const analysis = {arrows: [], notes: "No notes found."}

    // Load the PGN for the game into Chess.js so we can manipulate it in JavaScript
    let mainChessGame = new Chess();
    mainChessGame.loadPgn(game.pgn);

    // For this application, we will invert the board if the player had the black pieces
    let invert_board = mainChessGame.header().Black === playerName;

    // This variable tracks whether lines from the repertoire were found at all in the game
    let foundIntersection = false;

    // This variable holds a list of the next moves from the repertoire
    let repertoireMoves = [];

    // This variable tracks the index of the last move from the repertoire
    let finalMoveIndex = 0;

    let chess_game_step_by_step = new Chess();
    let checkFurther = false;

    let lastFEN = '';

    // don't recompute lines
    const gameCache = {};

    // Play moves until you find a position that's not in the repertoire
    for (let index = 0; index < mainChessGame.history().length; index++) {

        // Save the last FEN so that we can display it later
        lastFEN = chess_game_step_by_step.fen();
        // Get a chess.com move that we can add a red arrow for it later
        let move_made = chess_game_step_by_step.move(mainChessGame.history()[index]);

        let fen = chess_game_step_by_step.fen();

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
            finalMoveIndex = index;

            //console.log("Lines are", lines);
            let movesFromRepertoire = lines.map(line => {
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
            });

            // Take out any "oops" that may have gotten in
            // TODO refactor this code so that this is not necessary
            repertoireMoves = [...(movesFromRepertoire.filter(moveName => moveName !== "oops"))];

            foundIntersection = true;
            analysis.foundIntersection = true;
            analysis.invert_board = invert_board;

            // This next section adds a red arrow for the move that left book
            let arrowConfig = generateArrowConfig(move_made, invert_board, "red");

            analysis.arrows.push(arrowConfig)

            break;
        }
    }

    if (foundIntersection) {
        // De-duplicate to avoid duplicate arrows
        repertoireMoves = [...new Set(repertoireMoves)];
    }

    // Add arrows for each of the repertoire moves
    repertoireMoves.forEach(lastMove => {
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

        analysis.arrows.push(arrowConfig);
    });

    // console.time("new Chess(last_fen)")
    let chessGameDisplay = new Chess(lastFEN);
    // console.timeEnd("new Chess(last_fen)")

    // If there was no intersection, store the last position of the game
    // TODO consider showing the position after move 5
    if (!foundIntersection) {
        chessGameDisplay.loadPgn(game.pgn)
        //console.log("No intersection, loaded pgn instead");
        lastFEN = game.pgn
    }

    let advice = 'No advice found.';

    analysis.result = mainChessGame.header().Result

    analysis.finalMoveIndex = finalMoveIndex;
    analysis.fen_at_departure = chessGameDisplay.fen();

    // This is tricky, you left book if you were playing the color whose turn it was on departure
    analysis.you_left_book =
        foundIntersection && (
            chessGameDisplay.turn() === "w" ?
                mainChessGame.header().White === playerName :
                mainChessGame.header().Black === playerName);

    // TODO consider dynamically calculating this at display time
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
    analysis.displayFEN = chessGameDisplay.fen();

    analysis.headers = mainChessGame.header();

    const path = new URL(analysis.headers.ECOUrl).pathname;
    // Get the last path segment and replace hyphens with spaces
    const openingName = path.split('/').pop().replace(/-/g, ' ').replace(/[0-9].*/g, '');

    // analysis.openingFamily = openingName;

    analysis.openingFamily = getOpeningFamily(openingName)

    // console.log("Got analysis", analysis)

    analysisDatabase[game.url] = analysis;

    return analysis;
}

export default calculateAnalysis;