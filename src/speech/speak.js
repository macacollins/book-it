
const getUtterance = string => {
    const utterance = new SpeechSynthesisUtterance(string);
    utterance.rate = .7
    return utterance;
}

export default function speakMoves(moves, inverted) {
    let moveNumber = 0;
    let count = 0;

    const color = inverted ? "black" : "white"

    window.speechSynthesis.speak(getUtterance("You play " + color))

    for (let move of moves) {

        console.log("Speaking move", move);


        count++;
        let finalString = "";

        if (count / 2 > moveNumber) {
            moveNumber++;
            window.speechSynthesis.speak(getUtterance("" + moveNumber))
        }
        
        if (move === "O-O") {
            finalString = "short castle";
        } else if (move === "O-O-O") {
            finalString = "long castle";
        } else {

            if (move[0] === "B") {
                finalString = finalString + "Bishop-"
            } else if (move[0] === "N") {
                finalString = finalString + "Knight-"
            } else if (move[0] === "Q") {
                finalString = finalString + "Queen-"
            } else if (move[0] === "K") {
                finalString = finalString + "King-"
            } else if (move[0] === "R") {
                finalString = finalString + "Rook-"
            } else {
                finalString = finalString + move[0] + "-"
            }
    
            // TODO handle disambiguation
            if (move.indexOf("x") !== -1) {
                finalString = finalString + "takes-"
            }
    
            const startingIndex = 
                move.indexOf("x") === -1 ? 1 : move.indexOf("x") + 1;
    

            finalString = finalString + move.slice(startingIndex);

            console.log(finalString);
        }


        finalString = finalString.replace("+", "-check");

        const utterance = getUtterance(finalString);

        utterance.rate = .7
        window.speechSynthesis.speak(utterance)
    }

    window.speechSynthesis.speak(getUtterance("What do you play for " + color));
}