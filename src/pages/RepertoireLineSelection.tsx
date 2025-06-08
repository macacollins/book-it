import AnalysisDatabase from "../types/AnalysisDatabase";
import Repertoire from "../types/Repertoire";
import Game from "../types/Game";
import { useState, useRef, useEffect, useCallback } from "react";

import ChessBoard from "../components/ChessBoard";

import { Chess } from "chess.js";

import { getBookGames } from "../storage";

import LineViewer from "../components/LineViewer";

import { Button } from 'primereact/button';
import { useParams } from "react-router";
import { channelifyName } from "./channel-utils";

import  {useNavigate} from 'react-router';
import { ProgressSpinner } from "primereact/progressspinner";

interface ConfigPageProps {
  repertoireList: string[];
}

function ConfigPage({
  repertoireList
}: ConfigPageProps) {
  const [selectedRepertoire, setSelectedRepertoire] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [bookLines, setBookLines] = useState<any[]>([]);
  const [previewFEN, setPreviewFEN] = useState<string>("");

  const gameRef = useRef<any>(null);
  const chessboardRef = useRef<any>(null);

  const invert = useRef<any>();

  const { repertoirePathName, chapter } = useParams();

  useEffect(() => {
    (async () => {

        if (!repertoirePathName) {
            return;
        }
 
        const realRepertoireName = repertoireList.find(a => {
            if (channelifyName(a) === (repertoirePathName)) {
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

  const buttons = repertoireList.map((repertoireName) => {
    return (
      <Button onClick={() => setSelectedRepertoire(repertoireName)}>
        {repertoireName}
      </Button>
    );
  });

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

  const navigate = useNavigate();


  const [inverted, setInverted] = useState(false);
  const handleUserKeyPress = useCallback((event: any) => {
    const { key, keyCode } = event;
    console.log("Doing it", event);
    if (keyCode === 32 || (keyCode >= 65 && keyCode <= 90)) {
      invert.current = !invert.current;
      console.log("New invert value", invert, chessboardRef, gameRef);

      chessboardRef?.current?.position(gameRef?.current?.fen());
    } else {
      console.log("event", event);
    }
  }, []);

  useEffect(() => {
    setInverted(invert.current);
  }, [invert.current]);

  if (!selectedRepertoire || !bookLines) {
    return <ProgressSpinner/ >;
  }

  if (selectedRepertoire && (!Number(chapter) || chapters.length <= Number(chapter))) {
    console.log("WOWOWOWOW chatper was " + chapter);
    return;
  }
    // display line selection

    const lines = bookLines.filter(
      (bookLine) => bookLine.chapterName === chapters[Number(chapter)],
    );

    const moveArrays = lines.map((line) =>
      line.game.moves.map((move: any) => move.move),
    );

    let commonPath = moveArrays[0];

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

    console.log("lines", lines);

    const board = (
      <ChessBoard
        fen={chess.fen()}
        invert={inverted}
        name={"line-select-board"}
        game_url={""}
        draggable={false}
        arrows={[]}
        madeMoveRef={{ current: true }}
        moveCallback={(move) => {}}
      ></ChessBoard>
    );

    let lastChapter: any, nextChapter: any;

    for (let index = 0; index < chapters.length; index++) {
      if (chapters[index] === selectedChapter) {
        lastChapter = chapters[index - 1];
        nextChapter = chapters[index + 1];
      }
    }

    return (<>
      <div id="line-select" className="flex gap-2">
        <Button onClick={() => navigate("/book-it/repertoires")}>
          Home
        </Button>
        <Button onClick={() => navigate("/book-it/repertoires/" + repertoirePathName)}>
          {selectedRepertoire}
        </Button>
        <br></br>
        {lastChapter && (
        <Button onClick={() => navigate("/book-it/repertoires/" + repertoirePathName + "/" + lastChapter)}>
            {"<-" + lastChapter}
          </Button>
        )}
        {nextChapter && (
        <Button onClick={() => navigate("/book-it/repertoires/" + repertoirePathName + "/" + nextChapter)}>
        {nextChapter + " ->"}
          </Button>
        )}
        </div>
        <h2>{selectedChapter}</h2>
        {board}
        {previewFEN}
        <ul>
          {lines.map((line, index) => {

            const path = 
                "/book-it/repertoires/" + 
                repertoirePathName + 
                "/" + 
                chapter + 
                "/" + 
                index;

            return (
              <li>
                <Button outlined onClick={() => navigate(path)}>
                  {line.lineName}: {line.game.moves.length} moves
                </Button>
              </li>
            );
          })}
        </ul>
      </>
    );
}

export default ConfigPage;
