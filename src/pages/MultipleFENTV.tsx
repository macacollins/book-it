import React, { useState, useEffect, useRef } from "react";
import pgnParser, { ParsedPGN } from "pgn-parser";
import { Chess } from "chess.js";
import ChessBoard from "../components/ChessBoard";
import { Button } from "primereact/button";
import { TVPlan, TimedMove } from "../types/TVPlan";

import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import getTVPlan from "../tv/getTVPlanFromPGN";
import useWindowSize from "../hooks/useWindowSize";

const sleep = (m: any) => new Promise((r) => setTimeout(r, m));

function shuffle(array: any[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

export default function MultipleFENTV({
  fens,
  closeHandler,
  startInverted = false,
}: {
  fens: string[];
  closeHandler?: () => void;
  startInverted?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [finallyStarted, setFinallyStarted] = useState(false);
  const [results, setResults] = useState<any>();
  const [resultPGNs, setResultPGNs] = useState<ParsedPGN[]>();
  const [gameIDs, setGameIDs] = useState<string[]>([]);

  const [gameQueue, setGameQueue] = useState<ParsedPGN[]>([]);

  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [currentTVPlan, setCurrentTVPlan] = useState<TVPlan | undefined>();

  const boardRef = useRef<any>();
  const gameRef = useRef<any>();

  const [currentFEN, setCurrentFEN] = useState<string | undefined>();

  const [nextRequested, setNextRequested] = useState<boolean>(false);

  const size = useWindowSize();

  useEffect(() => {
    boardRef.current?.resize();
  }, [size]);

  useEffect(() => {
    let intervalID = setInterval(() => {
      if (currentTVPlan) {
        setFinallyStarted(true);

        const newDiff = (new Date().getTime() - currentTVPlan.startTime) / 1000;

        // console.log("t=", newDiff);
        let chess = new Chess();

        if (newDiff > currentTVPlan.totalDuration || nextRequested) {
          console.log("Going to the next one.");
          // go to next
          boardRef?.current?.position(chess.fen());
          gameRef.current = new Chess(chess.fen());

          //setCurrentFEN(chess.fen());

          if (gameQueue.length > 1) {
            setGameQueue(gameQueue.slice(1));
            const newPlan = getTVPlan(gameQueue[0]);
            console.log("New Plan", newPlan)
            setCurrentTVPlan(newPlan);
          } else {
            setGameQueue(resultPGNs ? shuffle(resultPGNs) : []);
          }

          setNextRequested(false);

          return;
        }

        const filteredMoves = currentTVPlan?.moves.filter(
          (move) => move.numberSeconds < newDiff,
        );

        filteredMoves?.forEach((move: TimedMove) => {
          chess.move(move.move);
        });

        console.log("After", new Date(currentTVPlan.startTime), new Date(), filteredMoves?.length, "Got", chess.fen(), currentTVPlan);

        boardRef?.current?.position(chess.fen());
        gameRef.current = new Chess(chess.fen());

        // setCurrentFEN(chess.fen());
        setCurrentTime(new Date().getTime());
      }
    }, 500);

    return () => {
      clearInterval(intervalID);
    };
  }, [
    currentTVPlan,
    setGameQueue,
    setResultPGNs,
    setCurrentTVPlan,
    setCurrentTime,
    setFinallyStarted,
    nextRequested,
    setNextRequested,
  ]);

  const [firstLoad, setFirstLoad] = useState(false);
  // actually load the data
  useEffect(() => {
    async function retrieveGameIDs(
      remainingFENs: string[],
      accumulator: string[] = [],
    ) {
      if (!loading) {
        return;
      }

      if (remainingFENs.length === 0 || finallyStarted) {
        setLoading(false);
        setGameIDs(shuffle(accumulator));
        console.log("Got to end of retrieveGameIDs");

        return;
      }

      const thisFEN = remainingFENs[0];

      const chess = new Chess(thisFEN);

      console.log("Loading lichess explorer data for ");
      console.log(chess.ascii());

      let params =
        "variant=standard" +
        `&fen=${thisFEN}` +
        "&speeds=blitz" +
        "&ratings=1800%2C2000%2C2200" +
        "&source=analysis";

      let finalURL = "https://explorer.lichess.ovh/lichess?" + params;

      const [cachedValueKey, cacheTimestampKey] = [
        "value:" + finalURL,
        "timestamp:" + finalURL,
      ];

      const [cachedValue, cacheTimestamp] = [cachedValueKey, cachedValueKey]
        .map((key) => localStorage.getItem(key))
        .map((value) => {
          if (value) {
            return JSON.parse(value);
          }
        });

      let results;

      if (cachedValue) {
        console.log("Got cached value.");
        results = cachedValue;
        if (new Date().getTime() > cacheTimestamp + 4 * 1000 * 60 * 60) {
          // No await
          fetch(finalURL)
            .then((response) => response.json())
            .then((json) => {
              if (json) {
                localStorage.setItem(cachedValueKey, JSON.stringify(json));
                localStorage.setItem(
                  cacheTimestampKey,
                  JSON.stringify(new Date().getTime()),
                );
              }
            })
            .catch((error) => {
              console.log("Got error when refreshing cache", error);
            });
        }
      } else {
        console.log("Missed cache, retrieving async");
        await sleep(1000);

        results = await fetch(finalURL).then((response) => response.json());

        localStorage.setItem(cachedValueKey, JSON.stringify(results));
        localStorage.setItem(
          cacheTimestampKey,
          JSON.stringify(new Date().getTime()),
        );
        console.log("Saved to cache");
      }

      // wow
      const newGameIDs = [
        ...new Set([
          ...accumulator,
          ...results.recentGames.map((game: any) => game.id),
        ]),
      ];

      setResults(results);
      retrieveGameIDs(remainingFENs.slice(1), newGameIDs);
    }

    retrieveGameIDs(fens);
  }, [firstLoad]);

  // load individual games
  useEffect(() => {
    // TODO figure out better async pattern here
    (async function () {
      if (!gameIDs || !gameIDs.length || loading || finallyStarted) {
        return;
      }

      console.log("Exporting games", gameIDs);

      let resultPGNs = [];
      let alreadySetTVPlan = false;
      for (let index = 0; index < gameIDs.length; index++) {
        const id = gameIDs[index];
        const finalURL =
          "https://lichess.org/game/export/" + id + "?clocks=true";
        const currentLocalStorage = localStorage.getItem(finalURL);

        let result;
        if (currentLocalStorage) {
          result = currentLocalStorage;
          console.log("Loaded from storage ", finalURL);
        } else {
          await sleep(2000);

          result = await fetch(finalURL).then((response) => response.text());

          localStorage.setItem(finalURL, result);
          console.log("Writing to storage", finalURL);
        }

        console.log(result);
        let resultPGN = pgnParser.parse(result)[0];

        resultPGNs.push(resultPGN);
        if (!alreadySetTVPlan) {
          alreadySetTVPlan = true;

          // the first time
          setCurrentTVPlan(getTVPlan(resultPGNs[0]));
        }
      }

      console.log("ResultPGNs", resultPGNs);
      setResultPGNs(resultPGNs);
      setGameQueue(shuffle(resultPGNs.slice(1)));
    })();
  }, [gameIDs, loading]);

  const headersInfo =
    loading && currentTVPlan ? (
      "Loading"
    ) : (
      <ul>
        {currentTVPlan?.originalPGN.headers?.map((header) => {
          return <li>{JSON.stringify(header, undefined, 2)}</li>;
        })}
      </ul>
    );

  const [inverted, setInverted] = useState(startInverted);
  const [showHeaders, setShowHeaders] = useState(false);

  const controlButtons = (
    <section className="buttons-section flex flex-column gap-3 px-18">
      <Button
        onClick={() => {
          setInverted(!inverted);
        }}
        label="Flip"
      />
      <Button
        onClick={() => {
          setNextRequested(true);
        }}
        label="Next Game"
      />
      <Button onClick={closeHandler} label="Back" />
      <Button onClick={() => boardRef.current?.resize()} label="Resize" />
      <Button
        onClick={() => setShowHeaders(!showHeaders)}
        label="Show Headers"
      />
    </section>
  );

  let whiteClock = "0:00";
  let blackClock = "0:00";

  if (currentTVPlan) {
    const newDiff = (currentTime - currentTVPlan.startTime) / 1000;

    const filteredMoves = currentTVPlan?.moves.filter(
      (move) => move.numberSeconds < newDiff,
    );

    if (filteredMoves.length) {
      let { whiteClockSeconds, blackClockSeconds, player } =
        filteredMoves.slice(-1)[0];

      const offset = newDiff - whiteClockSeconds - blackClockSeconds;
      //console.log("offset", offset);

      const blackOffset = player === "white" ? offset : 0;
      const whiteOffset = player === "white" ? 0 : offset;
      

      const format = (seconds: number) => {
        return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60) < 10 ? "0" : ""}${Math.floor(seconds % 60)}`;
      };

      whiteClock = format(
        currentTVPlan.timeControlBase +
          currentTVPlan.timeControlIncrement *
            Math.floor(filteredMoves.length / 2) -
          blackClockSeconds -
          whiteOffset,
      );

      blackClock = format(
        currentTVPlan.timeControlBase +
          currentTVPlan.timeControlIncrement * filteredMoves.length -
          whiteClockSeconds -
          blackOffset,
      );
    }
  }

  const clock = (
    <>
      <br />
      <label>
        <strong>White</strong>
      </label>{" "}
      {whiteClock}
      <br></br>
      <label>
        <strong>Black</strong>
      </label>{" "}
      {blackClock}
      <br></br>
    </>
  );

  return (
    <div className="tv flex flex-wrap row-gap-3 gap-3 md:p-5">
      <section className="view-area w">
        {loading ? (
          <ProgressSpinner />
        ) : (
          <ChessBoard
            fen={"blank"}
            moves={[]}
            invert={inverted}
            name={"tv-board"}
            game_url={"fakedrillresult"}
            draggable={false}
            chessboardRef={boardRef}
            gameRef={gameRef}
            size={"100%"}
          ></ChessBoard>
        )}
      </section>

      <section className="info-section">
         {clock}
         {showHeaders && headersInfo}
        {controlButtons}
      </section>
    </div>
  );
}
