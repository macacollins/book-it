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

  useEffect(() => {
    (async () => {
      if (selectedRepertoire) {
        setBookLines(await getBookGames(selectedRepertoire));
      }
    })();
  }, [selectedRepertoire]);

  const buttons = repertoireList.map((repertoireName) => {
    return (
      <button onClick={() => setSelectedRepertoire(repertoireName)}>
        {repertoireName}
      </button>
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

  if (!selectedRepertoire) {
    // Display repertoire selection
    
    return <><h2>All Repertoires</h2>{buttons}</>;
  } else if (!selectedChapter) {
    // display chapter selection

    const chapterButtons = chapters.map((chapter) => {
      return (
        <li>
          <button onClick={() => setSelectedChapter(chapter)}>
            {chapter}: {chapterInfo[chapter].numberLines}
          </button>
        </li>
      );
    })

    const chapterList = <ul>{chapterButtons}</ul>
    const board =<ChessBoard
      fen={"start"}
      invert={false}
      name={"chapter-viewer-board"}
      game_url={""}
      draggable={false}
      arrows={[]}
      madeMoveRef={{ current: true }}
      moveCallback={(move) => {}}
    ></ChessBoard>
    return (
      <div id="select-chapter">
        <button onClick={() => setSelectedRepertoire("")}>Home</button>
        <h2>{selectedRepertoire}</h2>
        {board}
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
      invert={false}
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
        <button onClick={() => setSelectedRepertoire("")}>Home</button>
        <button onClick={() => setSelectedChapter("")}>
          {selectedRepertoire}
        </button>
        <br></br>
        {lastChapter && <button onClick={() => setSelectedChapter(lastChapter)}>{'<-' + lastChapter}</button>}
        {nextChapter && <button onClick={() => setSelectedChapter(nextChapter)}>
        {nextChapter + ' ->'}
        </button>}
        <h2>{selectedChapter}</h2>
        {board}
        <ul>
          {lines.map((line) => {
            return (
              <li>
                <button onClick={() => setSelectedLine(line.lineName)}>
                  {line.lineName}: {line.game.moves.length} moves
                </button>
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
        <button
          onClick={() => {
            setSelectedRepertoire("");
            setSelectedChapter("");
            setSelectedLine("");
          }}
        >
          Home
        </button>
        <button
          onClick={() => {
            setSelectedChapter("");
            setSelectedLine("");
          }}
        >
          {selectedRepertoire}
        </button>
        <button onClick={() => setSelectedLine("")}>{selectedChapter}</button>
        <h2>{selectedLine}</h2>

        {lastLine && <button
          onClick={() => {
            setSelectedLine(lastLine);
          }}
        >
          Last
        </button>}
        {nextLine &&
          <button
            onClick={() => {
              setSelectedLine(nextLine);
            }}
          >
            Next
          </button>
        }

        <LineViewer line={lines[0]} />
      </>
    );
  }
}

export default ConfigPage;
