import { ParsedPGN } from 'pgn-parser';
import Game from '../types/Game';

// [Event "Rated rapid game"]
// [Site "https://lichess.org/HiLhjJ30"]
// [Date "2023.12.03"]
// [White "macacollins"]
// [Black "Goblin_Chess"]
// [Result "1-0"]
// [UTCDate "2023.12.03"]
// [UTCTime "04:51:23"]
// [WhiteElo "1617"]
// [BlackElo "1529"]
// [WhiteRatingDiff "+4"]
// [BlackRatingDiff "-5"]
// [Variant "Standard"]
// [TimeControl "600+0"]
// [ECO "B13"]
// [Termination "Normal"]

// 1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Bd3 Nc6 5. c3 a6 6. Nf3 Bg4 7. O-O e6 8. h3 Bxf3 9. Qxf3 Nge7 10. Nd2 b5 11. b4 Rc8 12. Nb3 Nf5 13. Bxf5 exf5 14. Qxf5 Be7 15. Qg4 h6 16. Nc5 Bg5 17. Re1+ Ne7 18. Bxg5 hxg5 19. Qxg5 O-O 20. Rxe7 f6 21. Qxg7# 1-0

export default function getGameFromPGN(inputPGN: ParsedPGN): Game | null {

    const headers = inputPGN.headers

    if (headers) {

        const headersObject: { [key: string] : string } = {};

        headers.forEach(header => {
            headersObject[header.name] = header.value;
        });

        var someDate = new Date(headersObject["UTCDate"] + " " + headersObject["UTCTime"] + "Z");
        const end_time = someDate.getTime();

        return {
            url : headersObject["Site"] || "",
            pgn: rePGNLine(inputPGN),
            end_time,
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        }
    }

    return null;
}

function rePGNLine(parsedPgn: ParsedPGN): string {

    let headerPGN = '';
    let result = "*";

    if (parsedPgn.headers) {
        for (let header of parsedPgn.headers) {
            headerPGN = `${headerPGN}\n[${header.name} "${header.value}"]`

            if (header.name === "Result") {
                result = header.value;
            }
        }
    }

    let currentNumber = 1;
    let gamePGN = '1.';
    for (let move of parsedPgn.moves) {
        if (typeof move.move_number === "undefined") {
            gamePGN = `${gamePGN} ${move.move}`;
        } else if (move.move_number !== currentNumber) {
            gamePGN = `${gamePGN} ${move.move_number}. ${move.move}`;
            currentNumber = move.move_number;
        } else {
            gamePGN = `${gamePGN} ${move.move}`;
        }
    }

    // console.log("Returning pgn " + fullPGN);

    return `${headerPGN}\n\n${gamePGN} ${result}`;
}