import React, { useState, useEffect, useRef } from "react";
import pgnParser, { ParsedPGN } from "pgn-parser";
import { Chess } from "chess.js";
import ChessBoard from "../components/ChessBoard";

export default function TV() {
  const urlParams = new URLSearchParams(window.location.search);
  const fen = urlParams.get("fen");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>();
  const [resultPGNs, setResultPGNs] = useState<any>();
  const [gameIDs, setGameIDs] = useState<any>();

  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [lastGameStartTime, setLastGameStartTime] = useState(
    new Date().getTime(),
  );
  const [currentTVPlan, setCurrentTVPlan] = useState<TVPlan | undefined>();

  const boardRef = useRef<any>();
  const gameRef = useRef<any>();
  const diff = Math.round((currentTime - lastGameStartTime) / 1000);

  const [currentFEN, setCurrentFEN] = useState<string | undefined>();

  useEffect(() => {
    let intervalID = setInterval(() => {
      if (currentTVPlan) {
        const newDiff = (new Date().getTime() - lastGameStartTime) / 1000;
        let chess = new Chess();

        if (newDiff > currentTVPlan.totalDuration) {
          // go to next
          boardRef?.current?.position(chess.fen());
          gameRef.current = new Chess(chess.fen());

          setCurrentFEN(chess.fen());
          setCurrentTime(new Date().getTime());
          setLastGameStartTime(new Date().getTime());

          if (gameIDs.length) {
            setGameIDs(gameIDs.slice(1));
          }

          return;
        }

        const filteredMoves = currentTVPlan?.moves.filter(
          (move) => move.numberSeconds < newDiff,
        );

        filteredMoves?.forEach((move: TimedMove) => {
          chess.move(move.move);
        });

        console.log("After ", filteredMoves?.length, "Got", chess.fen());

        boardRef?.current?.position(chess.fen());
        gameRef.current = new Chess(chess.fen());

        setCurrentFEN(chess.fen());
        setCurrentTime(new Date().getTime());
      }
    }, 500);

    return () => {
      clearInterval(intervalID);
    };
  }, [currentTVPlan]);

  // actually load the data
  useEffect(() => {
    (async () => {
      let params =
        "variant=standard" +
        `&fen=${fen}` +
        "&speeds=blitz" +
        "&ratings=1800%2C2000%2C2200" +
        "&source=analysis`";

      const results = await fetch(
        "https://explorer.lichess.ovh/lichess?" + params,
        {
          method: "GET",
        },
      ).then((response) => response.json());

      setGameIDs(results.recentGames.map((game: any) => game.id));

      setResults(results);
      setLoading(false);
    })();
  }, []);

  // load individual games
  useEffect(() => {
    // TODO figure out better async pattern here
    (async function () {
      if (!gameIDs || !gameIDs.length) {
        return;
      }

      let resultPGNs = [];
      for (let index = 0; index < gameIDs.length; index++) {
        const id = gameIDs[index];
        const finalURL =
          "https://lichess.org/game/export/" + id + "?clocks=true";

        const result = await fetch(finalURL).then((response) =>
          response.text(),
        );

        console.log(result);
        resultPGNs.push(pgnParser.parse(result)[0]);
      }

      console.log("ResultPGNs", resultPGNs);
      setResultPGNs(resultPGNs);

      setCurrentTVPlan(getTVPlan(resultPGNs[0]));
      setLastGameStartTime(new Date().getTime());
    })();
  }, [gameIDs]);

  return (
    <div id="viewer-board" className="tv">
      Showing TV for fen = {fen};<br />
      elapsed time {diff}
      <br />
      current fen {currentFEN}
      <ChessBoard
        fen={"blank"}
        moves={[]}
        invert={false}
        name={"tv-board"}
        game_url={"fakedrillresult"}
        draggable={false}
        chessboardRef={boardRef}
        gameRef={gameRef}
      ></ChessBoard>
      {resultPGNs && <pre>{JSON.stringify(currentTVPlan, undefined, 2)}</pre>}
    </div>
  );
}

interface TimedMove {
  timeString: string;
  numberSeconds: number;
  move: string;
}

interface TVPlan {
  moves: TimedMove[];
  originalPGN: ParsedPGN;
  totalDuration: number;
}

function getTVPlan(inputPGN: ParsedPGN): TVPlan {
  console.log(inputPGN);

  let timeControlBase = 0,
    timeControlIncrement = 0;

  inputPGN?.headers?.forEach((header: pgnParser.Header) => {
    if (header.name === "TimeControl") {
      [timeControlBase, timeControlIncrement] = header.value
        .split("+")
        .map(Number);
    }
  });

  //debugger;

  let blackClockElapsed = 0,
    whiteClockElapsed = 0;

  let duration = inputPGN.moves.length * timeControlIncrement + timeControlBase;

  const newMoves: TimedMove[] = inputPGN.moves.map(
    (move: pgnParser.Move, index: number) => {
      let time;
      try {
        // @ts-expect-error yah
        time = move.comments[0]?.commands[0]?.values[0];
      } catch (e) {
        debugger;
      }

      try {

        // @ts-expect-error yah
        const moveText = move.comments[0].text;
        const results = /.*%clk ([0]+:[0-9][0-9]:[0-9][0-9]).*/g.exec(
          moveText
        );
        time = results && results.length > 1 ? results[1] : undefined;
      } catch (e) {
        debugger;
      }

      if (!time) {
        debugger;
        return {
          timeString: "Not available",
          numberSeconds: 3,
          move: move.move,
        };
      }

      const [hour, minute, second] = time.split(":").map(Number);

      const totalTimeWithIncrements =
        timeControlBase + index * timeControlIncrement;

      const totalCurrent = hour * 60 * 60 + minute * 60 + second;

      const elapsedSeconds = totalTimeWithIncrements - totalCurrent;

      let numberSeconds;
      if (index % 2 == 1) {
        // white
        numberSeconds = blackClockElapsed + elapsedSeconds;
        whiteClockElapsed = elapsedSeconds;
      } else {
        // black
        blackClockElapsed = elapsedSeconds;
        numberSeconds = whiteClockElapsed + elapsedSeconds;
      }

      if (index === inputPGN.moves.length - 1) {
        duration = numberSeconds + 10; // End of game stay for 10 seconds
      }

      return {
        timeString: time,
        numberSeconds: numberSeconds,
        move: move.move,
      };
    },
  );

  return {
    moves: newMoves,
    originalPGN: inputPGN,
    totalDuration: duration,
  };
}
