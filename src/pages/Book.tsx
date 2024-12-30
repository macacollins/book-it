import { setItemDexie } from "../storage";
import AnalysisDatabase from "../types/AnalysisDatabase";
import Repertoire from "../types/Repertoire";
import Game from "../types/Game";
import { useState, useRef, useEffect, useCallback } from "react";
import pgnParser from "pgn-parser";

import ChessBoard from "../components/ChessBoard";

import { calculateGreenArrows } from "../analysis/calculateGreenArrows";
import { ArrowConfig } from "../types/ArrowConfig";
import Arrow from "../components/Arrow";
import { Chess } from "chess.js";

import { getBookGames } from "../storage";

import { exportComponentAsPNG } from "react-component-export-image";
import LineViewer from "../components/LineViewer";

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
  const [selectedRepertoire, setSelectedRepertoire] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [bookLines, setBookLines] = useState<any[]>([]);
  const [previewFEN, setPreviewFEN ] = useState<string>('');

  const gameRef = useRef<any>(null);
  const chessboardRef = useRef<any>(null);

  const invert = useRef<any>();

  useEffect(() => {
    (async () => {
      if (selectedRepertoire) {
        setBookLines(await getBookGames(selectedRepertoire));
      }
    })();
  }, [selectedRepertoire]);

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

      const moveArrays = lines.map(line => line.game.moves.map((move:any) => move.move));

      let commonPath = moveArrays[0];

      if (!commonPath) {

        chessboardRef?.current?.position(new Chess().fen());
        gameRef.current = new Chess();
        return;
      }

      moveArrays.forEach(moveArray => {
        for (let i = 0; i < (moveArray.length) && i < commonPath.length; i++) {
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
      console.log('setting to', chess.fen());
      chessboardRef?.current?.position(chess.fen());
      //gameRef.current = new Chess(chess.fen());
    } catch (e) {
      console.log("Not showing errors", e);
    }
  }

  const buttons = repertoireList.map((repertoireName) => {
    return (
      <md-text-button onClick={() => setSelectedRepertoire(repertoireName)}>
        {repertoireName}
      </md-text-button>
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

  const [inverted, setInverted] = useState(false);
  const handleUserKeyPress = useCallback((event:any) => {
      const { key, keyCode } = event;
      console.log("Doing it", event);
      if (keyCode === 32 || (keyCode >= 65 && keyCode <= 90)){
        invert.current = (!invert.current);
        console.log("New invert value", invert, chessboardRef, gameRef);

        chessboardRef?.current?.position(gameRef?.current?.fen())
      } else {
        console.log("event", event);
      }
  }, []);


  useEffect(() => {
    setInverted(invert.current);
  }, [invert.current])

  useEffect(() => {
      console.log("Adding listener");
      window.addEventListener("keydown", handleUserKeyPress);
      return () => {
          window.removeEventListener("keydown", handleUserKeyPress);
      };
  }, [handleUserKeyPress]);

  if (!selectedRepertoire) {
    // Display repertoire selection
    
    return <><h2>All Repertoires</h2>{buttons}</>;
  } else if (!selectedChapter) {
    // display chapter selection

    const chapterButtons = chapters.map((chapter) => {
      return (
        <li>
          <md-text-button 
              onMouseEnter={() => delayedDisplay(chapter)} 
              onClick={() => setSelectedChapter(chapter)}>
            {chapter}: {chapterInfo[chapter].numberLines}
          </md-text-button>
          <md-text-button 
              onClick={() => delayedDisplay(chapter)}>
            show
          </md-text-button>
        </li>
      );
    })

    const chapterList = <ul>{chapterButtons}</ul>
    const board =<ChessBoard
      fen={"start"}
      invert={inverted}
      name={"chapter-viewer-board"}
      game_url={""}
      draggable={false}
      arrows={[]}
      madeMoveRef={{ current: true }}
      moveCallback={(move) => {}}

      gameRef={gameRef}
      chessboardRef={chessboardRef}
      
    ></ChessBoard>
    return (
      <div id="select-chapter">
        <md-text-button onClick={() => setSelectedRepertoire("")}>Home</md-text-button>
        <h2>{selectedRepertoire}</h2>
        <div className="sticky-container">{board}</div>
        {chapterList}
      </div>
    );
  } else if (!selectedLine) {
    // display line selection

    const lines = bookLines.filter(
      (bookLine) => bookLine.chapterName === selectedChapter,
    );

    const moveArrays = lines.map(line => line.game.moves.map((move:any) => move.move));

    let commonPath = moveArrays[0];

    moveArrays.forEach(moveArray => {
      for (let i = 0; i < (moveArray.length) && i < commonPath.length; i++) {
        if (moveArray[i] !== commonPath[i]) {
          commonPath = commonPath.slice(0, i);
          continue;
        }
      }
    })

    const chess = new Chess();

    for (let move of commonPath) {
      chess.move(move);
    }

    console.log("lines", lines);

    const board = <ChessBoard
      fen={chess.fen()}
      invert={inverted}
      name={"line-select-board"}
      game_url={""}
      draggable={false}
      arrows={[]}
      madeMoveRef={{ current: true }}
      moveCallback={(move) => {}}
    ></ChessBoard>

    let lastChapter: any, nextChapter: any;

    for (let index = 0; index < chapters.length; index++) {
      if (chapters[index] === selectedChapter) {
        lastChapter = chapters[index - 1];
        nextChapter = chapters[index + 1]
      }
    }

    return (
      <div id="line-select">
        {JSON.stringify(invert)}{inverted}
        <md-text-button onClick={() => setSelectedRepertoire("")}>Home</md-text-button>
        <md-text-button onClick={() => setSelectedChapter("")}>
          {selectedRepertoire}
        </md-text-button>
        <br></br>
        {lastChapter && <md-text-button onClick={() => setSelectedChapter(lastChapter)}>{'<-' + lastChapter}</md-text-button>}
        {nextChapter && <md-text-button onClick={() => setSelectedChapter(nextChapter)}>
        {nextChapter + ' ->'}
        </md-text-button>}
        <h2>{selectedChapter}</h2>
        {board}
        {previewFEN}
        <ul>
          {lines.map((line) => {
            return (
              <li>
                <md-text-button 
                    onClick={() => setSelectedLine(line.lineName)}
                    >
                  {line.lineName}: {line.game.moves.length} moves
                </md-text-button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  } else {
    // display line info

    const lines = bookLines.filter(
      (bookLine) =>
        bookLine.chapterName === selectedChapter &&
        bookLine.lineName === selectedLine,
    );

    let lastLine: any, nextLine: any;

    let chapterLines = bookLines.filter(
      (bookLine) =>
        bookLine.chapterName === selectedChapter
    );
    
    for (let index = 0; index < chapterLines.length; index++) {
      if (chapterLines[index].lineName === selectedLine) {
        lastLine = chapterLines[index - 1]?.lineName;
        nextLine = chapterLines[index + 1]?.lineName
      }
    }

    return (
      <>
        <img className="n" />
        <md-text-button
          onClick={() => {
            setSelectedRepertoire("");
            setSelectedChapter("");
            setSelectedLine("");
          }}
        >
          Home
        </md-text-button>
        <md-text-button
          onClick={() => {
            setSelectedChapter("");
            setSelectedLine("");
          }}
        >
          {selectedRepertoire}
        </md-text-button>
        <md-text-button onClick={() => setSelectedLine("")}>{selectedChapter}</md-text-button>
        <h2>{selectedLine}</h2>

        {lastLine && <md-text-button
          onClick={() => {
            setSelectedLine(lastLine);
          }}
        >
          Last
        </md-text-button>}
        {nextLine &&
          <md-text-button
            onClick={() => {
              setSelectedLine(nextLine);
            }}
          >
            Next
          </md-text-button>
        }

        <LineViewer line={lines[0]} />
      </>
    );
  }
}

export default ConfigPage;
