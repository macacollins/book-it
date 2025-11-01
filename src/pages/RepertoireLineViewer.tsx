import AnalysisDatabase from "../types/AnalysisDatabase";
import Repertoire from "../types/Repertoire";
import Game from "../types/Game";
import { useState, useRef, useEffect, useCallback } from "react";

import ChessBoard from "../components/ChessBoard";

import { Chess } from "chess.js";

import { getBookGames } from "../storage";

import LineViewer from "../components/LineViewer";

import { Button } from "primereact/button";
import { channelifyName } from "./channel-utils";
import { useParams } from "react-router";
import { ProgressSpinner } from "primereact/progressspinner";
import pgnParser from "pgn-parser";

import { useNavigate } from "react-router";

interface ConfigPageProps {
  repertoireList: string[];
}

function RepertoireLineViewer({ repertoireList }: ConfigPageProps) {
  const [selectedRepertoire, setSelectedRepertoire] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [bookLines, setBookLines] = useState<any[]>([]);
  const [previewFEN, setPreviewFEN] = useState<string>("");

  const gameRef = useRef<any>(null);
  const chessboardRef = useRef<any>(null);

  const invert = useRef<any>();

  const navigate = useNavigate();

  const { repertoirePathName, chapter, line } = useParams();

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

  if (!bookLines || !chapter || !line) {
    return <ProgressSpinner />;
  }

  const chapterLines = bookLines.filter(
    (bookLine) => bookLine.chapterName === chapters[Number(chapter)],
  );

  const selectedLine = chapterLines[Number(line)];

  let lastLine: any, nextLine: any;

  for (let index = 0; index < chapterLines.length; index++) {
    if (chapterLines[index].lineName === selectedLine) {
      lastLine = chapterLines[index - 1]?.lineName;
      nextLine = chapterLines[index + 1]?.lineName;
    }
  }

  if (!selectedLine) {
    return (
      <>
        <ProgressSpinner />
      </>
    );
  }

  return (
    <>
      <nav className="flex gap-2">
        <img className="n" />
        <Button
          onClick={() => {
            navigate("/book-it/repertoires");
          }}
        >
          Home
        </Button>
        <Button
          onClick={() => {
            navigate("/book-it/repertoires/" + repertoirePathName);
          }}
        >
          {selectedRepertoire}
        </Button>
        <Button
          onClick={() =>
            navigate(
              "/book-it/repertoires/" + repertoirePathName + "/" + chapter,
            )
          }
        >
          {chapters[Number(chapter)]}
        </Button>
      </nav>
      <h2>{selectedLine.lineName}</h2>

      <div className="inline-flex gap-2 m-2">
        {lastLine && (
          <Button
            onClick={() => {
              alert("todo");
            }}
          >
            Last
          </Button>
        )}
        {nextLine && (
          <Button
            onClick={() => {
              alert("todo");
            }}
          >
            Next
          </Button>
        )}
      </div>
      <LineViewer
        repertoire={selectedRepertoire}
        line={{ game: selectedLine.game, comments_above_header: "" }}
        lineToShow={selectedLine}
      />
    </>
  );
}

export default RepertoireLineViewer;
