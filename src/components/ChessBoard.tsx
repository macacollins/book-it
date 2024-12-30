import Drawings from "./Drawings";
import { ReactElement, useEffect, useState } from "react";

import { Chess, Move } from "chess.js";
import useWindowSize from "../hooks/useWindowSize";
import { ArrowConfig } from "../types/ArrowConfig";

export interface ChessBoardProps {
  name: string;
  game_url: string;
  invert?: boolean;
  draggable?: boolean;
  madeMoveRef?: any;
  moves?: string[];
  fen: string;
  chessboardRef?: any; // TODO find the correct type
  gameRef?: any;
  dropOffBoard?: string;
  arrows?: ReactElement[];

  size?: string;
  moveCallback?: (move: Move) => void;
  
}

const ChessBoard = ({
  name,
  game_url,
  invert = false,
  fen = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R",
  arrows = [],
  draggable = false,
  dropOffBoard = "snapback",
  madeMoveRef = { current: true },
  moveCallback = (move: Move) => {
    console.log("Got move", move);
  },
  moves = [],
  chessboardRef = { current: undefined },
  gameRef = { current: undefined },
  size="512px"
}: ChessBoardProps) => {
  const width = useWindowSize()[0];

  const finalID = name + game_url.replace(/[^a-zA-Z0-9]/g, "");

  // Initialize the board after the component mounts to the DOM
  useEffect(() => {
    setTimeout(() => {
      gameRef.current = new Chess();

      function onDragStart(_source: string, piece: string, _position: any, _orientation: any) {
        console.log("onDragStart called, madeMove = ", madeMoveRef);

        if (madeMoveRef.current) {
          console.log("already made move");
          return false;
        }

        // only pick up pieces for the side to move
        if (
          (gameRef.current.turn() === "w" && piece.search(/^b/) !== -1) ||
          (gameRef.current.turn() === "b" && piece.search(/^w/) !== -1)
        ) {
          return false;
        }
      }

      // update the board position after the piece snap
      // for castling, en passant, pawn promotion
      function onSnapEnd() {
        chessboardRef.current?.position(gameRef.current.fen());
      }

      function onDrop(source: any, target: any) {
        console.log("onDrop called");

        const chess = new Chess();
        let move: Move = chess.move("e4");


        try {
          // see if the move is legal
          move = gameRef.current.move({
            from: source,
            to: target,
            // promotion: 'q' // NOTE: always promote to a queen for example simplicity
          });

          moveCallback(move);
        } catch (e) {
          //console.log("Invalid move attempted", e)
          return "snapback";
        }

        moveCallback(move);
      }

      const config = {
        position: fen,
        draggable: draggable,
        dropOffBoard,
        onDragStart,
        onDrop,
        onSnapEnd,
      };

      try {
        // TODO fork and react-ify this library

        const domElement = document.getElementById(finalID);

        if (!domElement) {
          console.log(
            "DOM element was not present. App will not call Chessboard to avoid an alert() call.",
          );
          return;
        }
        /*global Chessboard */
        // @ts-expect-error It's OK until we get a react chess board
        chessboardRef.current = Chessboard(finalID, config);

      } catch (e) {
        // This fires sometimes when it does not affect the experience
        console.log("Got exception", e);
      }

      function makeMoves(moves: string[]) {
        if (moves.length) {
          setTimeout(() => {
            // console.log("Moving", moves);

            // console.log("Trying singleMove", singleMove);

            let singleMove;
            try {
              singleMove = gameRef.current.move(moves[0]);

              // board.move(`${singleMove.from}-${singleMove.to}`);
              chessboardRef?.current?.position(gameRef.current.fen());
            } catch (e) {
              // This "shouldn't" ever happen
              // In the real world this is a good place to log for debugging
              console.debug(
                "Unable to make move",
                singleMove,
                " on board",
                gameRef.current,
                e,
              );
            }
            makeMoves(moves.slice(1));
          }, 250);
        }
      }

      if (!chessboardRef?.current) {
        return;
      }

      setTimeout(() => {
        makeMoves(moves);
      }, 200);

      if (invert) {
        chessboardRef?.current?.flip();
      }

      // Turn off mobile scrolling behavior if they drag inside the board on mobile
      const domBoard = document.getElementById(finalID);

      if (draggable) {
        function preventBehavior(e: any) {
          e.preventDefault();
        }

        domBoard?.addEventListener("touchmove", preventBehavior, {
          passive: false,
        });
      }
    }, 100);

    // If you take out the dependency array, it remakes the board each time
    // eslint-disable-next-line
  }, [fen, finalID, invert]);

  // Resize when the window changes width
  useEffect(
    () => {
      if (chessboardRef.current) {
        chessboardRef.current.resize();
      }
    },
    // We don't care about the dependency on board; it won't be re-set with the current code
    // eslint-disable-next-line
    [width],
  );

  let drawings = <Drawings arrows={arrows}> </Drawings>;

  // let widthOfChessboard = width - 36;
  let widthOfChessboard = Math.min(width - 36, 513);

  let style = {
    height: size,
    width: size
  };

  return (
    <div className="side-by-side">
      {drawings}
      <div id={finalID} style={style}></div>
    </div>
  );
};

export default ChessBoard;
