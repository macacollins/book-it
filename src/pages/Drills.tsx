import { useState, useRef, useEffect } from "react";

import AnalysisDatabase from "../types/AnalysisDatabase";
import Game from "../types/Game";
import Arrow from "../components/Arrow";
import ChessBoard from "../components/ChessBoard";
import { Chess } from "chess.js";
import useWindowSize from "../hooks/useWindowSize";

import findTopOpenings from "../analysis/findTopOpenings";
import speakMoves from "../speech/speak";
import Repertoire from "../types/Repertoire";

import pgnParser, { Move, ParsedPGN } from "pgn-parser";
import { ArrowConfig } from "../types/ArrowConfig";
import AnalysisResult from "../types/AnalysisResult";
import generateArrowConfig from "../analysis/generateArrowConfig";

import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { SelectButton } from "primereact/selectbutton";

// TODO make this happen

export default function Drills(props: {
  analysisDatabase: AnalysisDatabase;
  games: any;
  repertoire: Repertoire;
}) {
  const analysisDatabase: AnalysisDatabase = props.analysisDatabase;
  const games = props.games;
  const repertoire = props.repertoire;

  const width = useWindowSize()[0];

  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);

  const [currentDrillResult, setCurrentDrillResult] = useState("");

  const [currentOpeningFilter, setCurrentOpeningFilter] = useState("");

  const [showBlindfoldAnswer, setShowBlindfoldAnswer] = useState(false);

  const madeMove = useRef(false);

  //[{ [name: string]: Repertoire }, Dispatch<SetStateAction<{ [name: string]: Repertoire }>>]
  const [currentDrillMode, setCurrentDrillMode] = useState("Unselected");

  const frequencyTable: { [fen: string]: number } = {};
  const gameLookup: { [fen: string]: Game } = {};

  const [repetitions, setRepetitions] = useState(3);
  const [delaySeconds, setDelaySeconds] = useState(3);

  const [exerciseGames, setExerciseGames]: [Game[], any] = useState([]);

  const [blindfold, setBlindfold] = useState<boolean>(false);
  const [depth, setDepth] = useState<number>(1);
  const [color, setColor] = useState<string>("White");
  const [moves, setMoves] = useState<string[]>([]);
  let newMoves = [...moves];

  let [selectedOpeningFilter, setSelectedOpeningFilter] = useState();

  // cache drills to run to avoid re-computing each time
  useEffect(() => {
    let finalGames: Game[] = [];

    let normalGames =
      (games &&
        games.filter &&
        games.filter((nextGame: Game) => {
          return (
            analysisDatabase[nextGame.url] &&
            analysisDatabase[nextGame.url].youLeftBook &&
            analysisDatabase[nextGame.url].foundIntersection
          );
        })) ||
      [];

    if (currentDrillMode === "Time" || currentDrillMode === "Blindfold") {
      finalGames = normalGames;

      if (currentOpeningFilter) {
        finalGames = normalGames.filter((game: Game) => {
          return (
            analysisDatabase[game.url].openingFamily === currentOpeningFilter
          );
        });
      }
    } else if (currentDrillMode === "FromOpening") {
      finalGames = normalGames.filter((game: Game) => {
        return (
          analysisDatabase[game.url].openingFamily === currentOpeningFilter
        );
      });
    } else if (currentDrillMode === "FromPosition") {
      let chessGame = new Chess();

      moves.forEach((move) => chessGame.move(move));

      let finalFEN = chessGame.fen();

      const repertoireLines = repertoire[finalFEN];
      const almostTargetDepth = moves.length + depth * 2;

      const targetDepth =
        color === "White"
          ? almostTargetDepth % 2 === 0
            ? almostTargetDepth
            : almostTargetDepth - 1
          : almostTargetDepth % 2 === 1
            ? almostTargetDepth
            : almostTargetDepth - 1;
      console.log(
        "Depth is ",
        depth,
        "current moves are",
        moves.length,
        "target is",
        targetDepth,
      );

      let tempMap: Record<string, Game> = {};
      repertoireLines.forEach((line) => {
        let parsedPGN = pgnParser.parse(line + " *")[0];

        let result = parsedPGN.moves.slice(0, targetDepth);
        parsedPGN.moves = result;

        let innerChessGame = new Chess();

        result.forEach((move: Move) => innerChessGame.move(move.move));

        let finalFEN = innerChessGame.fen();

        tempMap[finalFEN] = {
          url: "none",
          pgn: rePGNLine(parsedPGN),
          end_time: 3,
          fen: finalFEN,
          origin: "repertoire",
        };
      });

      const finalFinalLines = Object.values(tempMap);

      console.log("FinalFEN", finalFEN, "finalLines", finalFinalLines);

      finalGames = finalFinalLines;
    } else if (currentDrillMode === "Frequency") {
      if (games && games.filter) {
        games
          .filter((nextGame: Game) => {
            return (
              analysisDatabase[nextGame.url] &&
              analysisDatabase[nextGame.url].youLeftBook &&
              analysisDatabase[nextGame.url].foundIntersection
            );
          })
          .forEach((game: Game) => {
            let activeFEN = analysisDatabase[game.url].displayFEN;

            if (frequencyTable[activeFEN]) {
              frequencyTable[activeFEN] = frequencyTable[activeFEN] + 1;
            } else {
              frequencyTable[activeFEN] = 1;
              gameLookup[activeFEN] = game;
            }
          });

        function frequencyComparison(a: string, b: string) {
          return frequencyTable[b] - frequencyTable[a];
        }

        finalGames = Object.keys(gameLookup)
          .sort(frequencyComparison)
          .map((fen) => gameLookup[fen]);
      }

      console.log("Got sorted games. Top 3 games below.");

      let firstGameAscii = new Chess(finalGames[0].fen).ascii();

      console.log(
        `With ${frequencyTable[finalGames[0].fen]} results`,
        firstGameAscii,
      );

      if (finalGames.length > 2) {
        let secondGameAscii = new Chess(finalGames[1].fen).ascii();
        let thirdGameAscii = new Chess(finalGames[2].fen).ascii();

        console.log(
          `With ${frequencyTable[finalGames[1].fen]} results`,
          secondGameAscii,
        );
        console.log(
          `With ${frequencyTable[finalGames[2].fen]} results`,
          thirdGameAscii,
        );
      }
    }

    setExerciseGames(finalGames);
    // eslint-disable-next-line
  }, [currentDrillMode]);

  // TODO separate into menu component?
  if (currentDrillMode === "Unselected") {
    let normalGames =
      (games &&
        games.filter &&
        games.filter((nextGame: Game) => {
          return (
            analysisDatabase[nextGame.url] &&
            analysisDatabase[nextGame.url].youLeftBook &&
            analysisDatabase[nextGame.url].foundIntersection
          );
        })) ||
      [];

    let topOpenings = findTopOpenings(normalGames, analysisDatabase).slice(
      0,
      14,
    );

    const openingOptions = topOpenings.map(({ opening, count }) => {
      return {
        code: opening + " " + count,
        label: opening,
      };
    });

    const openingFiltersFull = (
      <>
        <label>Opening Filter</label>
        <div>
          <Dropdown
            value={selectedOpeningFilter}
            onChange={(e) => {
              setSelectedOpeningFilter(e.value);
              setCurrentOpeningFilter(e.value);
            }}
            options={openingOptions}
            optionLabel="code"
            optionValue="label"
            placeholder="Select an Opening"
            className="w-25rem"
          />
        </div>
      </>
    );

    const side = (
      <div>
        <label>Color</label>
        <SelectButton
          value={color}
          options={["White", "Black"]}
          onChange={(e: any) => setColor(e.value)}
        ></SelectButton>
      </div>
    );

    let depthSelections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((number) => ({
      code: number,
      value: number,
    }));

    const depthFull = (
      <div>
        <label>Depth</label>
        <br></br>
        <Dropdown
          value={depth}
          onChange={(e) => {
            setDepth(e.value);
          }}
          options={depthSelections}
          optionLabel="code"
          optionValue="value"
          placeholder="Select Depth"
          className="w-25rem"
        />
      </div>
    );

    return (
      <>
        <label>Drill Type</label>
        <SelectButton
          value={blindfold ? "Blindfold" : "Visual"}
          options={["Visual", "Blindfold"]}
          onChange={(e: any) => setBlindfold(e.value === "Blindfold")}
        ></SelectButton>

        <label>Start Drills</label>
        <div className="flex gap-3">
          <Button
            data-testid={"time-button"}
            className={"time-button"}
            onClick={() => {
              setCurrentDrillMode("Time");
            }}
          >
            Time
          </Button>

          <Button
            data-testid={"frequency-button"}
            className={"frequency-button"}
            onClick={() => {
              setCurrentDrillMode("Frequency");
            }}
          >
            Frequency
          </Button>

          <Button
            data-testid={"from-position-button"}
            className={"from-position-button"}
            onClick={() => {
              setCurrentDrillMode("FromPosition");
            }}
          >
            From Position
          </Button>

          <Button
            data-testid={"from-opening-button"}
            className={"from-opening-button"}
            onClick={() => {
              setCurrentDrillMode("FromOpening");
            }}
          >
            From Opening
          </Button>
        </div>
        {depthFull}

        {side}

        {openingFiltersFull}
        <label>Starting Position</label>
        <ChessBoard
          name="exercise-filter"
          game_url="exercise-filter"
          fen="start"
          draggable={true}
          madeMoveRef={{ current: false }}
          dropOffBoard="snapback"
          moveCallback={(move) => {
            newMoves = [...newMoves, move.san];
            console.log(
              "Got move",
              move.san,
              "moves",
              moves,
              "newMoves",
              newMoves,
            );
            setMoves(newMoves);
          }}
        />
      </>
    );
  }

  const maybeNextGame: Game | undefined =
    exerciseGames.length > currentDrillIndex
      ? exerciseGames[currentDrillIndex]
      : undefined;

  let drillBoard = <></>;
  let drillCurrentDisplay = <></>;

  let widthOfChessboard = Math.min(width - 36, 513);

  let actualChessboardWidth =
    widthOfChessboard % 8 === 0
      ? widthOfChessboard - 8
      : widthOfChessboard - (widthOfChessboard % 8);

  let buttonStyles = {
    width: actualChessboardWidth + "px",
  };

  // console.log("Next game", nextGame);
  if (typeof maybeNextGame !== "undefined") {
    const nextGame: Game = maybeNextGame;

    let drillAnalysisResult = getDrillAnalysisResult(
      currentDrillMode,
      nextGame,
      repertoire,
      color,
      analysisDatabase,
    );

    const chessJSGame = new Chess();
    chessJSGame.loadPgn(nextGame.pgn);

    let moves;
    if (currentDrillMode === "FromPosition") {
      moves = chessJSGame.history();
    } else {
      moves = chessJSGame
        .history()
        .slice(0, drillAnalysisResult.finalMoveIndex);
    }

    drillBoard = (
      <li>
        <div slot="supporting-text">
          <div className="side-by-side">
            <ChessBoard
              fen={"start"}
              moves={moves}
              invert={drillAnalysisResult.invert_board}
              name={"drill-board" + currentDrillIndex}
              game_url={nextGame.url + "drillresult"}
              draggable={!currentDrillResult}
              arrows={
                currentDrillResult
                  ? drillAnalysisResult.arrows.map(
                      (arrow: any, index: number) => (
                        <Arrow key={index} {...arrow}></Arrow>
                      ),
                    )
                  : []
              }
              madeMoveRef={madeMove}
              moveCallback={(move) => {
                // console.log(drillAnalysisResult.arrows);
                // console.log(move);

                let filtered = drillAnalysisResult.arrows
                  .filter((arrow: any) => arrow.color === "green")
                  .filter((arrow: any) => arrow.san === move.san);

                if (filtered.length > 0) {
                  // console.log("Success, " + move.san + " was the right move.");
                  setCurrentDrillResult("Success");
                } else {
                  // console.log("failure, was expecting another move")
                  setCurrentDrillResult("Failure");
                }

                madeMove.current = true;
              }}
            ></ChessBoard>
          </div>
          <br></br>
          {/*<p><a href={"https://lichess.org/opening/" + openingName}>{drillAnalysisResult.headers.ECO} {openingName}</a></p>*/}
          <div className="buttonlist" style={buttonStyles}>
            <Button
              data-testid={"chess-dot-com-button"}
              onClick={() => window.open(drillAnalysisResult.headers.Link)}
            >
              Chess.com
            </Button>
            <Button
              data-testid={"lichess-button"}
              onClick={() =>
                window.open(
                  "https://lichess.org/analysis/" +
                    drillAnalysisResult.displayFEN,
                )
              }
            >
              Lichess
            </Button>
            <Button
              data-testid={"chessable-button"}
              onClick={() =>
                window.open(
                  "https://www.chessable.com/courses/fen/" +
                    drillAnalysisResult.displayFEN,
                )
              }
            >
              Chessable
            </Button>
            {frequencyTable[drillAnalysisResult.displayFEN]}
            <br></br>
          </div>
        </div>
      </li>
    );

    if (currentDrillResult === "Failure") {
      drillCurrentDisplay = (
        <>
          <p style={{ lineHeight: "36px" }}>
            {"Oops, better study on this one."}
            <Button
              data-testid={"next-button"}
              onClick={() => {
                setCurrentDrillIndex(currentDrillIndex + 1);
                setCurrentDrillResult("");
                madeMove.current = false;
              }}
            >
              Next
            </Button>
          </p>
        </>
      );
    } else if (currentDrillResult === "Success") {
      drillCurrentDisplay = (
        <>
          <p style={{ lineHeight: "36px" }}>
            {"Congrats, you did it!"}
            <Button
              data-testid={"next-button"}
              className={"drill-button"}
              onClick={() => {
                setCurrentDrillIndex(currentDrillIndex + 1);
                setCurrentDrillResult("");
                madeMove.current = false;
              }}
            >
              Next
            </Button>
          </p>
        </>
      );
    }
  }

  let repetitionSelections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(
    (number) => (
      <option
        data-testid={`repetitions-${number}`}
        value={number}
        key={JSON.stringify(number)}
        onClick={() => {
          setRepetitions(number);
        }}
      >
        {number}
      </option>
    ),
  );

  const depthFull = (
    <>
      <h3>Repetitions</h3>
      <select value={repetitions}>{repetitionSelections}</select>
    </>
  );

  let delaySecondsSelections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(
    (number) => (
      <option
        data-testid={`delaySeconds-${number}`}
        value={number}
        key={JSON.stringify(number)}
        onClick={() => {
          setDelaySeconds(number);
        }}
      >
        {number}
      </option>
    ),
  );

  const delaySecondsFull = (
    <>
      <h3>Delay (Seconds)</h3>
      <select value={delaySeconds}>{delaySecondsSelections}</select>
    </>
  );

  const drillAnalysisResult =
    maybeNextGame &&
    getDrillAnalysisResult(
      currentDrillMode,
      maybeNextGame,
      repertoire,
      color,
      analysisDatabase,
    );

  let filtered: any = drillAnalysisResult?.arrows.filter(
    (arrow: any) => arrow.color === "green",
  )[0];

  const playNext = async (drillIndex: number) => {
    const maybeNextGame: Game | undefined =
      exerciseGames.length > drillIndex ? exerciseGames[drillIndex] : undefined;

    if (maybeNextGame) {
      const nextGame: Game = maybeNextGame;

      const drillAnalysisResult = getDrillAnalysisResult(
        currentDrillMode,
        maybeNextGame,
        repertoire,
        color,
        analysisDatabase,
      );

      const chessJSGame = new Chess();
      chessJSGame.loadPgn(nextGame.pgn);

      const moves = chessJSGame
        .history()
        .slice(0, drillAnalysisResult.finalMoveIndex);

      await speakMoves(
        moves,
        drillAnalysisResult.invert_board,
        repetitions,
        delaySeconds,
      );
    }
  };

  const blindfoldButtons = (
    <>
      {currentDrillIndex} / {exerciseGames.length}
      <br></br>
      <Button
        data-testid={"speak-button"}
        onClick={async () => {
          let drillIndex = currentDrillIndex;

          await playNext(drillIndex);
          console.log("Finished first play");
        }}
      >
        Speak
      </Button>
      {showBlindfoldAnswer ? (
        <Button
          data-testid={"hide-answer-button"}
          onClick={() => {
            setShowBlindfoldAnswer(false);
          }}
        >
          Hide answer
        </Button>
      ) : (
        <Button
          data-testid={"see-answer-button"}
          onClick={() => {
            setShowBlindfoldAnswer(true);
          }}
        >
          See answer
        </Button>
      )}
      <Button
        data-testid={"next-button"}
        onClick={() => {
          setCurrentDrillIndex(currentDrillIndex + 1);
          setCurrentDrillResult("");
          setShowBlindfoldAnswer(false);
        }}
      >
        Next
      </Button>
      <Button
        data-testid={"lichess-button"}
        onClick={() =>
          window.open(
            "https://lichess.org/analysis/" + drillAnalysisResult?.displayFEN,
          )
        }
      >
        Lichess
      </Button>
      <Button
        data-testid={"chessable-button"}
        onClick={() =>
          window.open(
            "https://www.chessable.com/courses/fen/" +
              drillAnalysisResult?.displayFEN,
          )
        }
      >
        Chessable
      </Button>
      <br></br>
      {depthFull}
      {delaySecondsFull}
      <br></br>
    </>
  );

  const blindfoldDisplay = <>{showBlindfoldAnswer ? filtered?.san : ""}</>;

  if (blindfold) {
    drillBoard = (
      <>
        {blindfoldDisplay} {blindfoldButtons}{" "}
      </>
    );
  }

  return (
    <>
      {drillBoard}
      {drillCurrentDisplay}
    </>
  );
}

function getDrillAnalysisResult(
  currentDrillMode: string,
  nextGame: Game,
  repertoire: Repertoire,
  color: string,
  analysisDatabase: AnalysisDatabase,
) {
  if (currentDrillMode === "FromPosition") {
    let arrows: ArrowConfig[] = [];
    let parsedPGN = pgnParser.parse(nextGame.pgn)[0];
    let length = parsedPGN.moves.length;

    repertoire[nextGame.fen].forEach((pgn) => {
      let innerParsedPGN = pgnParser.parse(pgn + " *")[0];
      let lastMove = innerParsedPGN.moves.slice(length)[0];

      if (innerParsedPGN.moves.length === length) {
        console.log("Skipping pgn", pgn);
        return;
      }

      if (!lastMove) {
        console.log("The fuck");
      }

      let chessGame = new Chess();

      innerParsedPGN.moves
        .slice(0, length)
        .forEach((move) => chessGame.move(move.move));

      let result = chessGame.move(lastMove.move);

      arrows.push(generateArrowConfig(result, color === "Black", "green"));
    });

    const tempResult: AnalysisResult = {
      invert_board: color === "Black",
      arrows: arrows,
      result: "unknown",
      finalMoveIndex: 1000,

      youLeftBook: true,
      foundIntersection: true,
      advice: "",
      displayFEN: nextGame.fen,
      headers: [],
      openingFamily: "Unknown",
    };

    return tempResult;
  } else {
    return analysisDatabase[nextGame.url];
  }
}

// this is silly
function rePGNLine(parsedPgn: ParsedPGN): string {
  let headerPGN = "";
  let result = "*";

  if (parsedPgn.headers) {
    for (let header of parsedPgn.headers) {
      headerPGN = `${headerPGN}\n[${header.name} "${header.value}"]`;

      if (header.name === "Result") {
        result = header.value;
      }
    }
  }

  let currentNumber = 1;
  let gamePGN = "1.";
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
