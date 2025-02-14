import { useState, useRef } from "react";
import { Button } from "primereact/button";
import ChessBoard from "../components/ChessBoard";
import { Chess, Move } from "chess.js";

export function TVFENPicker({
  setFEN,
  invert,
}: {
  setFEN: any;
  invert: boolean;
}) {
  const boardRef = useRef<any>();
  const gameRef = useRef<any>();
  const madeMoveRef = { current: false };

  const [currentFEN, setCurrentFEN] = useState("");

  return (<>
              <div className="mb-3 flex pt-4 justify-content-between">

    <Button
        onClick={() => {
          gameRef.current = new Chess();
          boardRef.current?.position("start");
        }}
      >
        Clear Board
      </Button>
      </div>
      <ChessBoard
        fen={"start"}
        moves={[]}
        invert={invert}
        madeMoveRef={madeMoveRef}
        name={"atv-board"}
        game_url={"fakedrillresult"}
        draggable={true}
        chessboardRef={boardRef}
        gameRef={gameRef}
        moveCallback={(move: Move) => {
          setFEN(gameRef.current?.fen());
          //setCurrentFEN(gameRef.current?.fen());
        }}
        size="512px"
      ></ChessBoard>
      
      
    </>
  );
}
