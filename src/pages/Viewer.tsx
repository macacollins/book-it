import { setItemDexie } from "../storage";
import AnalysisDatabase from "../types/AnalysisDatabase";
import Repertoire from "../types/Repertoire";
import Game from "../types/Game";
import { useState, useRef, useEffect } from "react";
import pgnParser from "pgn-parser";

import ChessBoard from "../components/ChessBoard";

import { calculateGreenArrows } from "../analysis/calculateGreenArrows";
import { ArrowConfig } from "../types/ArrowConfig";
import Arrow from "../components/Arrow";
import { Chess } from "chess.js";

import { getComments } from "../storage";

import { exportComponentAsPNG } from "react-component-export-image";

interface ConfigPageProps {
  playerName: string;
  setPlayerName: (newValue: string) => void;
  lichessPlayerName: string;
  setLichessPlayerName: (newValue: string) => void;
  repertoireChoice: string;
  setRepertoireChoice: (newValue: string) => void;
  newRepertoireNameField: string;
  setNewRepertoireNameField: (newValue: string) => void;
  setRepertoire: (newValue: { [name: string]: Repertoire }) => void;
  repertoire: { [name: string]: Repertoire };
  repertoireList: string[];
  setRepertoireList: (newValue: string[]) => void;
  dispatchAnalysisDatabase: any;
  setGames: (newValue: Game[]) => void;
  games: Game[];
  analysisDatabase: AnalysisDatabase;
}

function ConfigPage({
  playerName,
  setPlayerName,
  lichessPlayerName,
  setLichessPlayerName,
  repertoireChoice,
  setRepertoireChoice,
  newRepertoireNameField,
  setNewRepertoireNameField,
  setRepertoire,
  repertoire,
  repertoireList,
  setRepertoireList,
  dispatchAnalysisDatabase,
  setGames,
  games,
  analysisDatabase,
}: ConfigPageProps) {
  // Make the checkbox items for repertoire selection
  const checkboxItems = (repertoireList ? repertoireList : []).map(
    (repertoireName) => {
      const props =
        repertoireName === repertoireChoice
          ? {
              checked: true,
              "touch-target": "wrapper",
            }
          : {
              "touch-target": "wrapper",
            };

      return (
        <div className="radio-label" key={repertoireName}>
          <md-radio
            data-testid={"repertoireChoiceField" + repertoireName}
            aria-label={repertoireName}
            onClick={() => {
              setRepertoireChoice(repertoireName);
              setItemDexie("repertoireChoice", repertoireName);
            }}
            id="default-lines-radio"
            name="with-labels"
            {...props}
          ></md-radio>
          <label htmlFor="default-lines-radio">{repertoireName}</label>
        </div>
      );
    },
  );
  const [initialMoves, setInitialMoves] = useState<ArrowConfig[]>([]);
  useEffect(() => {
    const chosenRepertoire = repertoire[repertoireChoice];

    let lines: string[] = [];
    Object.values(chosenRepertoire).forEach((list) => {
      lines.push(...list);
    });

    let nextMoves = [];
    for (let line of lines) {
      let parsedPGN = pgnParser.parse(line + " *")[0];

      const comments = parsedPGN.moves.slice(movesArray.current.length - 1);
      if (comments.length) {
        setCurrentComments(JSON.stringify(comments[0].comments));
      }

      const sliced = parsedPGN.moves.slice(movesArray.current.length);

      if (!sliced.length) {
        continue;
      }

      const move = sliced[0].move;

      nextMoves.push(move);
    }

    const newInitialMoves = calculateGreenArrows(
      nextMoves,
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      false,
    );
    setNextMoves(newInitialMoves);
    setInitialMoves(newInitialMoves);
  }, [repertoire, repertoireChoice]);

  const invert_board = false;

  const [currentFEN, setCurrentFEN] = useState("");

  const movesArray = useRef<string[]>([]);

  const [nextMoves, setNextMoves] = useState<ArrowConfig[]>([]);

  const [currentComments, setCurrentComments] = useState("");

  const boardRef = useRef<any>();
  const gameRef = useRef<any>();

  const reset = () => {
    boardRef?.current?.position(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    setNextMoves(initialMoves);

    gameRef.current = new Chess();
  };

  // fen, moves, comments
  const fenMap: any = useRef({});

  const backOneMove = () => {
    if (movesArray.current && movesArray.current.length === 1) {
      reset();
      return;
    }

    let newMovesArray = movesArray.current.slice(0, -1);

    movesArray.current = newMovesArray;

    let { fen, moveConfigs, comments } = fenMap.current[newMovesArray.join("")];

    boardRef?.current?.position(fen);
    gameRef.current = new Chess(fen);
    setNextMoves(moveConfigs);
    setCurrentComments(comments.comments);
  };

  const componentRef = useRef<any>();

  const downloadBoard = () => {
    exportComponentAsPNG(componentRef);
  };

  return (
    <>
      <h2>Viewer</h2>

      <h3>Repertoire</h3>
      <div className="column" role="radiogroup" aria-label="Repertoire">
        {checkboxItems}
      </div>
      {currentComments}
      <h3>Explorer</h3>
      <button onClick={() => backOneMove()}>Back</button>
      <button onClick={() => reset()}>Reset</button>
      <button onClick={() => downloadBoard()}>Reset</button>
      <md-list-item>
        <div slot="supporting-text">
          <div className="side-by-side center-fix" ref={componentRef}>
            <ChessBoard
              fen={"start"}
              invert={invert_board}
              name={"viewer-board"}
              game_url={""}
              draggable={true}
              chessboardRef={boardRef}
              gameRef={gameRef}
              arrows={nextMoves.map((move, index) => (
                <Arrow index={index} hidden={false} {...move} />
              ))}
              madeMoveRef={{ current: false }}
              moveCallback={async (move) => {
                // console.log(drillAnalysisResult.arrows);
                console.log(move);

                movesArray.current = [...movesArray.current, move.san];
                setCurrentFEN(move.after);

                const chosenRepertoire = repertoire[repertoireChoice];

                const lines = chosenRepertoire[move.after];

                console.log(
                  "Moves array is ",
                  movesArray.current,
                  " slice index is ",
                  movesArray.current.length,
                );

                let finishedCommentsSearch = false;
                let nextMoves = [];
                let comments = [];
                for (let line of lines) {
                  let parsedPGN = pgnParser.parse(line + " *")[0];

                  if (!finishedCommentsSearch) {
                    comments = await getComments(move.after, repertoireChoice);
                    console.log("comment lookup got", comments[0]);

                    if (comments.length) {
                      setCurrentComments(JSON.stringify(comments[0].comments));
                    }

                    finishedCommentsSearch = true;
                  }

                  const sliced = parsedPGN.moves.slice(
                    movesArray.current.length,
                  );

                  if (!sliced.length) {
                    continue;
                  }

                  const nextMove = sliced[0].move;

                  nextMoves.push(nextMove);
                }

                const moveConfigs = calculateGreenArrows(
                  nextMoves,
                  move.after,
                  false,
                );
                setNextMoves(moveConfigs);

                fenMap.current[movesArray.current.join("")] = {
                  fen: move.after,
                  comments,
                  moveConfigs,
                };
                // let filtered =
                //     drillAnalysisResult
                //         .arrows
                //         .filter((arrow: any) => arrow.color === "green")
                //         .filter((arrow: any) => arrow.san === move.san);

                // if (filtered.length > 0) {
                //     // console.log("Success, " + move.san + " was the right move.");
                //     setCurrentDrillResult("Success");
                // } else {
                //     // console.log("failure, was expecting another move")
                //     setCurrentDrillResult("Failure")
                // }
              }}
            ></ChessBoard>
          </div>
          <br></br>
          {/*<p><a href={"https://lichess.org/opening/" + openingName}>{drillAnalysisResult.headers.ECO} {openingName}</a></p>*/}
          <div className="buttonlist">
            <md-text-button
              data-testid={"lichess-button"}
              onClick={() =>
                window.open("https://lichess.org/analysis/" + currentFEN)
              }
            >
              Lichess
            </md-text-button>
            <md-text-button
              data-testid={"chessable-button"}
              onClick={() =>
                window.open(
                  "https://www.chessable.com/courses/fen/" + currentFEN,
                )
              }
            >
              Chessable
            </md-text-button>
            <br></br>
          </div>
        </div>
      </md-list-item>
    </>
  );
}

export default ConfigPage;
