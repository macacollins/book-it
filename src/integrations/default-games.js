import {Chess} from 'chess.js';

function createDefaultGame(pgn, whiteOrBlack) {

    let chess = new Chess();
    chess.loadPgn(pgn);

    let fen = chess.fen();

    const random5DigitNumber = Math.floor(Math.random() * 90000) + 10000;

    if (whiteOrBlack === 'black') {
        return {
            "url":"https://www.chess.com/game/live/996745" + random5DigitNumber,
            "pgn":"[Event \"Live Chess\"]\n[Site \"Chess.com\"]\n[Date \"2020.03.15\"]\n[Round \"-\"]\n[White \"opponent\"]\n[Black \"example\"]\n[Result \"1-0\"]\n[CurrentPosition \"" + fen + "\"]\n[Timezone \"UTC\"]\n[ECO \"B10\"]\n[ECOUrl \"https://www.chess.com/openings/Queen's+Gambit+Declined\"]\n[UTCDate \"2020.03.15\"]\n[UTCTime \"14:59:58\"]\n[WhiteElo \"1000\"]\n[BlackElo \"912\"]\n[TimeControl \"300\"]\n[Termination \"opponent won on time\"]\n[StartTime \"14:59:58\"]\n[EndDate \"2020.03.15\"]\n[EndTime \"15:08:13\"]\n[Link \"https://www.chess.com/game/live/996" + random5DigitNumber + "821\"]\n\n" + pgn + " 1-0\n",
            "time_control":"300",
            "end_time":1705936093,
            "rated":true,
            "uuid":"e71" + random5DigitNumber + "-b936-11ee-9498-6cfe" + random5DigitNumber + "428",
            "initial_setup":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            "fen":fen,
            "time_class":"blitz",
            "rules":"chess",
            "white": {
                "rating":1000,
                "result":"win",
                "username":"opponent",
                "uuid":"38e8a3a8-e56b-11ea-8289-" + random5DigitNumber + "12323eb"
            },"black":{
                "rating":1000,
                "result":"timeout",
                "username":"example",
                "uuid":"c969e3f8-8910-11e6-801a-00" + random5DigitNumber + random5DigitNumber
            }
        }
    } else {
        return {
            "url":"https://www.chess.com/game/live/996745" + random5DigitNumber,
            "pgn":"[Event \"Live Chess\"]\n[Site \"Chess.com\"]\n[Date \"2020.03.15\"]\n[Round \"-\"]\n[White \"example\"]\n[Black \"opponent\"]\n[Result \"1-0\"]\n[CurrentPosition \"" + fen + "\"]\n[Timezone \"UTC\"]\n[ECO \"B10\"]\n[ECOUrl \"https://www.chess.com/openings/Queen's+Gambit+Declined\"]\n[UTCDate \"2020.03.15\"]\n[UTCTime \"14:59:58\"]\n[WhiteElo \"1000\"]\n[BlackElo \"912\"]\n[TimeControl \"300\"]\n[Termination \"opponent won on time\"]\n[StartTime \"14:59:58\"]\n[EndDate \"2020.03.15\"]\n[EndTime \"15:08:13\"]\n[Link \"https://www.chess.com/game/live/996" + random5DigitNumber + "821\"]\n\n" + pgn + " 1-0\n",
            "time_control":"300",
            "end_time":1705936093,
            "rated":true,
            "uuid":"e71" + random5DigitNumber + "-b936-11ee-9498-6cfe" + random5DigitNumber + "428",
            "initial_setup":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            "fen":fen,
            "time_class":"blitz",
            "rules":"chess",
            "white": {
                "rating":1000,
                "result":"win",
                "username":"example",
                "uuid":"38e8a3a8-e56b-11ea-8289-" + random5DigitNumber + "12323eb"
            },"black":{
                "rating":1000,
                "result":"timeout",
                "username":"opponent",
                "uuid":"c969e3f8-8910-11e6-801a-00" + random5DigitNumber + random5DigitNumber
            }
        }
    }
}

let whiteGames = [
    "1.d4 Nf6 2.c4 g6 3.Nf3 Bg7 4.Bg5 h6 5.Bh4 c5 6.e3 a6",
    "1.d4 d5 2.c4 e6 3.Nc3 c5 4.e3 Nf6 5.Nf3 Nc6 6.a3 Ne4 7.Be2",
    "1.d4 d5 2.c4 dxc4 3.e3 c5 4.Bxc4 cxd4 5.e4"
].map(pgn => createDefaultGame(pgn, "white"))

let blackGames = [
    "1.d4 Nf6 2.c4 g6 3.Nf3 Bg7 4.Bg5 h6 5.Bh4 c5 6.e3 a6",
    "1.d4 d5 2.c4 dxc4 3.e3 Nf6 4.Bxc4 a6 5.a4 e6 6.Nf3 Nc6"
].map(pgn => createDefaultGame(pgn, "black"))

let totalGames = [ ...whiteGames, ...blackGames];
export default  totalGames;