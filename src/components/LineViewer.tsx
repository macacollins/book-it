import { Chess } from "chess.js";
import ChessBoard from "./ChessBoard";
import { useRef, useEffect, useState } from "react";
import generateSVG from "../integrations/generateSVG";

export default function LineViewer({ line }: { line: any }) {
  const chessboardRef = useRef<any>();

  const gameRef = useRef<any>();
  const [inverted, setInverted] = useState(false);

  useEffect(() => {});

  const setBoard = (moves: string[]) => {
    const game = new Chess();

    moves.forEach((move) => {
      game.move(move);
    });

    chessboardRef?.current?.position(game.fen());

    gameRef.current = game;
  };

  const board = (
    <ChessBoard
      fen={"start"}
      invert={inverted}
      name={"viewer-board"}
      game_url={""}
      draggable={false}
      chessboardRef={chessboardRef}
      gameRef={gameRef}
      arrows={[]}
      madeMoveRef={{ current: true }}
      moveCallback={(move) => {}}
    ></ChessBoard>
  );

  let lastMoveNumber = 0;
  let movesArray: string[] = [];
  const moves = line.game.moves.map((move: any) => {
    movesArray.push(move.move);
    const frozenMoves = [...movesArray]; // don't get stuck
    let moveNumber = "";
    if (move.move_number && move.move_number > lastMoveNumber) {
      lastMoveNumber = move.move_number;
      moveNumber = `${lastMoveNumber}. `;
    }

    const comments = move.comments
      ?.map((comment: any) => comment.text)
      .join(" ");

    return (
      <>
        {moveNumber}
        <button
          onClick={() => {
            setBoard(frozenMoves);
          }}
        >
          {move.move}
        </button>
        {comments}
      </>
    );
  });

  return (
    <>
      <button onClick={() => generateSVG(gameRef.current?.fen())}>
        Download SVG
      </button>
      <button onClick={() => setInverted(!inverted)}>Invert</button>
      <br></br>
      <div className="inline">{board}</div>
      <br></br>
      {moves}
    </>
  );
}
