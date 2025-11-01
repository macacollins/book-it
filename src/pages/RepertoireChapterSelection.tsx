import AnalysisDatabase from "../types/AnalysisDatabase";
import Repertoire from "../types/Repertoire";
import Game from "../types/Game";
import { useState, useRef, useEffect, useCallback } from "react";

import ChessBoard from "../components/ChessBoard";

import { Chess } from "chess.js";

import { getBookGames } from "../storage";

import { Button } from "primereact/button";
import { useNavigate, useParams } from "react-router";
import { channelifyName } from "./channel-utils";

interface ConfigPageProps {
  repertoireList: string[];
}

function ConfigPage({ repertoireList }: ConfigPageProps) {
  const navigate = useNavigate();

  const [selectedRepertoire, setSelectedRepertoire] = useState<string>("");
  const [bookLines, setBookLines] = useState<any[]>([]);

  const gameRef = useRef<any>(null);
  const chessboardRef = useRef<any>(null);

  const { repertoirePathName } = useParams();

  useEffect(() => {
    (async () => {
      if (!repertoirePathName) {
        return;
      }

      const realRepertoireName = repertoireList.find((a) => {
        if (channelifyName(a) === repertoirePathName) {
          return a;
        }
      });

      if (realRepertoireName) {
        setSelectedRepertoire(realRepertoireName);
        setBookLines(await getBookGames(realRepertoireName));
      }
    })();
  }, []);

  const [delayTimer, setDelayTimer] = useState<any>();

  function delayedDisplay(chapterName: string) {
    if (delayTimer) {
      clearTimeout(delayTimer);
    }

    const timeoutID = setTimeout(() => {
      test(chapterName);

      setDelayTimer(0);
    }, 500);

    setDelayTimer(timeoutID);
  }

  function test(chapterName: string) {
    try {
      const lines = bookLines.filter(
        (bookLine) => bookLine.chapterName === chapterName,
      );

      const moveArrays = lines.map((line) =>
        line.game.moves.map((move: any) => move.move),
      );

      let commonPath = moveArrays[0];

      if (!commonPath) {
        chessboardRef?.current?.position(new Chess().fen());
        gameRef.current = new Chess();
        return;
      }

      moveArrays.forEach((moveArray) => {
        for (let i = 0; i < moveArray.length && i < commonPath.length; i++) {
          if (moveArray[i] !== commonPath[i]) {
            commonPath = commonPath.slice(0, i);
            continue;
          }
        }
      });

      const chess = new Chess();

      for (let move of commonPath) {
        chess.move(move);
      }
      console.log("setting to", chess.fen());
      chessboardRef?.current?.position(chess.fen());
      //gameRef.current = new Chess(chess.fen());
    } catch (e) {
      console.log("Not showing errors", e);
    }
  }

  const chapters: string[] = [];
  const chapterInfo: any = {};
  bookLines.map((bookLine) => {
    const chapterName = bookLine.chapterName;
    if (chapterInfo[chapterName]) {
      chapterInfo[chapterName].numberLines =
        chapterInfo[chapterName].numberLines + 1;
    } else {
      chapterInfo[chapterName] = {
        numberLines: 1,
      };
      chapters.push(chapterName);
    }
  });

  const chapterButtons = chapters.map((chapter, index) => {
    return (
      <li>
        <Button
          onMouseEnter={() => delayedDisplay(chapter)}
          onClick={() =>
            navigate(`/book-it/repertoires/${repertoirePathName}/${index}`)
          }
        >
          {chapter}: {chapterInfo[chapter].numberLines}
        </Button>
        <Button onClick={() => delayedDisplay(chapter)}>show</Button>
      </li>
    );
  });

  const chapterList = <ul>{chapterButtons}</ul>;
  const board = (
    <div className="max-w-3rem">
      <ChessBoard
        fen={"start"}
        invert={false}
        name={"chapter-viewer-board"}
        game_url={""}
        draggable={false}
        arrows={[]}
        madeMoveRef={{ current: true }}
        moveCallback={(move) => {}}
        gameRef={gameRef}
        chessboardRef={chessboardRef}
      ></ChessBoard>
    </div>
  );
  return (
    <div id="select-chapter">
      <Button onClick={() => navigate("/book-it/repertoires")}>Home</Button>
      <h2>{selectedRepertoire}</h2>
      <div className="sticky-container">{board}</div>
      {chapterList}
    </div>
  );
}

export default ConfigPage;
