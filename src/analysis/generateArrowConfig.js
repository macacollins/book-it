export default function generateArrowConfig(move_made, invert_board, color) {
    let [fromX, fromY] = squareToCoordinates(move_made.from);
    let [toX, toY] = squareToCoordinates(move_made.to);

    if (invert_board) {
        toY = 9 - toY;
        fromY = 9 - fromY;
        toX = 9 - toX;
        fromX = 9 - fromX;
    }

    let arrowConfig = {
        color,
        fromX, fromY,
        destX: toX,
        destY: toY,
        san: move_made.san
    }
    return arrowConfig;
}

function squareToCoordinates(inputString) {
    // Check if the input string is valid

    // Extract letter and number
    const letter = inputString.charAt(0);
    const number = parseInt(inputString.charAt(1));

    // Calculate the index of the letter (a=1, b=2, ..., h=8)
    const letterIndex = letter.charCodeAt(0) - 'a'.charCodeAt(0) + 1;

    // Return a list with the calculated values
    return [letterIndex, number];
}