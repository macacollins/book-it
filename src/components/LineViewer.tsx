import { Chess } from "chess.js";
import ChessBoard from "./ChessBoard";
import { useRef, useEffect, useState } from "react";
import generateSVG from "../integrations/generateSVG";
import pgnParser, { Move, ParsedPGN } from "pgn-parser";
import findPGN from "../analysis/findPGN";
import parseComments, { CommentNode } from "../commentParser/parseComments";

/**
 * { type: LINE_MOVE, move: string }
 * { type: FEN_ENTRY, fen: string }
 * { type: MOVES, pgn_string: string }
 */
export default function LineViewer({ line }: { line: { comments_above_header: string, game: ParsedPGN } }) {
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

  const setBoardFEN = (fen: string) => {
    console.log("Setting to", fen);
    const game = new Chess(fen);
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
  const moves = line.game.moves.map((move: Move) => {
    movesArray.push(move.move);

    const thisLineSoFar = [...movesArray]; // don't get stuck
    let moveNumber = "";
    if (move.move_number && move.move_number > lastMoveNumber) {
      lastMoveNumber = move.move_number;
      moveNumber = `${lastMoveNumber}. `;
    }

    const comments = move.comments
      ?.map((comment: any) => comment.text)
      .join(" ");


    const sections = parseComments(comments, line.game);

    console.log("Got some sections", sections);

    const commentElements = <>
      {sections.map((section: CommentNode) => {
        if (section.type === "Text" || section.type === "Unprocessed") {
          return section.text
        } else if (section.type === "FEN" && section.fen) {
          let fen = section.fen;
          if (fen)
            return  <button onClick={() => setBoardFEN(fen)}>{section.text}</button>
          return section.text
        } else if (section.type === "Move") {
          let fen = section.fen;
          if (fen) {
            return  <button onClick={() => setBoardFEN(fen || "")}>{section.text}</button>
          }
            
          return section.text;
        } else if (section.type === "Bold") {
          return  <b>{section.text}</b>
        }
      })}
    </>;

      return <>
      <br/>
      <b>{move.move_number}</b>
      <button
        onClick={() => {
          setBoard(thisLineSoFar);
        }}
      >
        {move.move}
      </button>
      {commentElements}
    </>

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
/* old
    const comments = move.comments
      ?.map((comment: any) => comment.text)
      .join(" ")
      .replaceAll("@@StartBracket@@", "(")
      .replaceAll("@@EndBracket@@", ")");

    const split = comments.split(/@@StartFEN@@([^@]+)@@EndFen@@/i);

    const finalComments = split.map((splitItem: string, index: number) => {
      if (index % 2 === 1) {
        return <button onClick={() => setBoardFEN(splitItem)}>{splitItem}</button>
      }

      const movesAtStart = findPGN(splitItem);
      if (movesAtStart?.length) {
        try {
          const results = pgnParser.parse(movesAtStart[0] + " *");

          const movesArray: string[] = [];
          const buttons: any[] = [];
          if (results && results[0]) {
            results[0].moves.map((move, index) => {
              if (index % 2 === 0) {
                buttons.push(`${(index / 2) + 1}. `)
              }
              movesArray.push(move.move);

              const capturedMoves = [...movesArray];
              buttons.push(<button onClick={() => setBoard(capturedMoves)}>{move.move}</button>);
            });
          }

          if (buttons.length) {
            return <>{buttons}{splitItem.slice(movesAtStart[0].length)}</>
          }

        } catch (e) {
          console.log("Unable to do it", e);
        }
      }

      return splitItem;
    });

    */