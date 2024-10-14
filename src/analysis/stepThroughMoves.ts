import { Chess } from "chess.js";
import { getRepertoireMove } from "./getRepertoireMove";
import generateArrowConfig from "./generateArrowConfig";
import Repertoire from "../types/Repertoire";
import { ArrowConfig } from "../types/ArrowConfig";
import { ParsedPGN } from "pgn-parser";

interface Result {
  lastFEN: string;
  repertoireMoves: string[];
  finalMoveIndex: number;
  foundIntersection: boolean;
  arrow: ArrowConfig | undefined;
}

export function stepThroughMoves(
  mainChessGame: ParsedPGN,
  repertoire: Repertoire,
  invert_board: boolean,
): Result {
  let chessGameStepByStep = new Chess();
  let checkFurther = false;
  let repertoireMoves: string[] = [];

  let finalMoveIndex = 0;
  let foundIntersection = false;
  let arrow: ArrowConfig | undefined = undefined;

  let lastFEN = "";

  let lastMatch;

  let numberMatchingSegments = 0;

  // Play moves until you find a position that's not in the repertoire
  for (let index = 0; index < mainChessGame.moves.length; index++) {
    // Save the last FEN so that we can display it later
    lastFEN = chessGameStepByStep.fen();
    // Get a chess.com move that we can add a red arrow for it later
    let move_made = chessGameStepByStep.move(mainChessGame.moves[index].move);

    let fen = chessGameStepByStep.fen();

    // If the position was in the repertoire, mark that we found a position in it
    if (!checkFurther && repertoire[fen]) {
      // recognized at least one
      checkFurther = true;
      numberMatchingSegments++;
    }

    // If we matched once, but don't match the current position, we have left the repertoire
    // Save the position details, add the arrows, etc. and break from the loop
    if (checkFurther && !repertoire[fen]) {
      //console.log("Couldn't find ", chess_game_step_by_step.ascii())
      let lines = repertoire[lastFEN] || [];
      finalMoveIndex = index;

      // console.log("Lines are", lines);
      let movesFromRepertoire = lines.map(getRepertoireMove(index));

      // Take out any "oops" that may have gotten in
      // TODO refactor this code so that this is not necessary
      repertoireMoves = [
        ...movesFromRepertoire.filter((moveName) => moveName !== "oops"),
      ];

      foundIntersection = true;

      // This next section adds a red arrow for the move that left book
      let arrowConfig = generateArrowConfig(move_made, invert_board, "red");

      arrow = arrowConfig;

      lastMatch = {
        lastFEN,
        repertoireMoves,
        finalMoveIndex,
        foundIntersection,
        arrow,
      };
      checkFurther = false;
      console.log(
        "Setting check further to false but continuing.",
        numberMatchingSegments,
      );
    }
  }

  if (lastMatch) {
    return lastMatch;
  } else {
    return {
      lastFEN,
      repertoireMoves,
      finalMoveIndex,
      foundIntersection,
      arrow,
    };
  }
}
