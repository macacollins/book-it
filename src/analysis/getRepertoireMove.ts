
import pgnParser, { ParsedPGN } from 'pgn-parser';

export function getRepertoireMove(index: number): (newValue: string) => string {
    return line => {
        // This variable gets the rest of the moves from the line after the current position
        let maybeMoves;

        console.log(line);

        // This library wants the asterisk at the end to signify the end of the line
        const finalThing = line.trim() + " *";
        try {
            let tempGame: ParsedPGN = pgnParser.parse(finalThing)[0];

            maybeMoves = tempGame.moves.slice(index, index + 1);
        } catch (e) {
            console.log("Got pgn parser error", finalThing, e);
            return "oops";
        }


        if (maybeMoves && maybeMoves.length > 0) {
            // console.log("")
            return maybeMoves[0].move;
        } else {
            // If there was not another move for whatever reason
            return "oops"
        }
    };
}