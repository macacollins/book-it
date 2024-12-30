import React, { useState, useEffect, useRef } from 'react';
import Repertoire from '../types/Repertoire';
import ChessBoard from '../components/ChessBoard';

import { Chess, Move } from 'chess.js';

import {Button} from 'primereact/button';
import { InputText} from 'primereact/inputtext';
import pgnParser, { ParsedPGN } from 'pgn-parser';
import MultipleFENTV from './MultipleFENTV';

export interface TVPickerProps {
    repertoire: Repertoire;
}


export default function TVPicker({ repertoire } : TVPickerProps) {

    const boardRef = useRef<any>();
    const gameRef = useRef<any>();

    const urlParams = new URLSearchParams(window.location.search);
    const [ fen, setFEN ] = useState(urlParams.get('fen'));

    const [ playChannel, setPlayChannel ] = useState(false);

    if (!fen) {
        return <TVFENPicker setFEN={setFEN}></TVFENPicker>;
    }
    let lines = 
        repertoire[fen].map(line => {
            const lineChess = new Chess();

            let pgn: ParsedPGN = pgnParser.parse(line + " *")[0];

            let countdown = pgn.moves.length;
            let currentIndex = 0;

            let finalFEN = fen;
            pgn.moves.forEach(move => {
                currentIndex = currentIndex + 1;
                countdown = countdown - 1;

                lineChess.move(move.move);

                if (lineChess.fen() === fen) {
                    countdown = 2;
                }

                if (countdown === 0) {
                    finalFEN = lineChess.fen();
                }
            });

            return finalFEN;
        })

    // Get unique only
    lines = [ ...new Set(lines)]

    if (playChannel) {
        return <MultipleFENTV fens={lines} />
    }

    return <>
        TV Picker
        <Button onClick={() => {
            setPlayChannel(true);
        }}>Start Channel</Button>
        { lines.map(fen => <LineDisplay fen={fen}/>) }
    </>

}

function LineDisplay({fen}: {fen: string}) {

    const boardRef = useRef<any>();
    const gameRef = useRef<any>();
        const madeMoveRef = { current: false }

    return <li>
        {fen} 
        <ChessBoard 
        chessboardRef={boardRef} madeMoveRef ={madeMoveRef}
        gameRef={gameRef} name={fen.replaceAll(/[^a-zA-Z]/g, "")} fen={fen} game_url={fen}></ChessBoard>
        </li>
}

function TVFENPicker({setFEN}: {setFEN: any}) {

    const boardRef = useRef<any>();
    const gameRef = useRef<any>();
    const madeMoveRef = { current: false }

    const [currentFEN, setCurrentFEN] = useState("");

    return <><ChessBoard
        fen={"start"}
        moves={[]}
        invert={false}
        madeMoveRef={madeMoveRef}
        name={"tv-board"}
        game_url={"fakedrillresult"}
        draggable={true}
        chessboardRef={boardRef}
        gameRef={gameRef}
        moveCallback={(move: Move) => {
            setCurrentFEN(gameRef.current?.fen())
        }}
      ></ChessBoard>
      <br/>
      {currentFEN}
      <Button onClick={() => { setFEN(currentFEN) }}>View Repertoire Lines</Button>
  </>
}