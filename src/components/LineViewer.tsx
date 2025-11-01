import { Chess } from "chess.js";
import ChessBoard from "./ChessBoard";
import { useRef, useEffect, useState } from "react";
import generateSVG from "../integrations/generateSVG";
import pgnParser, { Move, ParsedPGN } from "pgn-parser";
import findPGN from "../analysis/findPGN";
import parseComments, { CommentNode } from "../commentParser/parseComments";
import { Button } from "primereact/button";

import { useEventListener } from "primereact/hooks";
import { current } from "@reduxjs/toolkit";
import { Divider } from "primereact/divider";
import { InputTextarea } from "primereact/inputtextarea";
import Repertoire from "../types/Repertoire";
import { AnyIfEmpty } from "react-redux";
import { ProgressSpinner } from "primereact/progressspinner";
import AnnotationsFromPGN from "../pages/AnnotationsFromPGN";
import { useNavigate } from "react-router";

/**
 * { type: LINE_MOVE, move: string }
 * { type: FEN_ENTRY, fen: string }
 * { type: MOVES, pgn_string: string }
 */
export default function LineViewer({
  line,
  repertoire,
  lineToShow,
}: {
  line: { comments_above_header: string; game: ParsedPGN };
  repertoire: string;
  lineToShow: string;
}) {
  const chessboardRef = useRef<any>();

  const gameRef = useRef<any>();
  const [inverted, setInverted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const goBack = () => {
    if (currentIndex !== 0) {
      setCurrentIndex(currentIndex - 1);

      const chess = new Chess();
      line.game.moves.slice(0, currentIndex - 1).map((move: pgnParser.Move) => {
        chess.move(move.move, { strict: false });
      });

      chessboardRef.current?.position(chess.fen());
      gameRef.current = chess;

      const id = "button-nav-" + currentIndex;
      document.querySelector("#" + id)?.scrollIntoView();
    }
  };

  const goForward = () => {
    if (currentIndex !== line.game.moves.length) {
      setCurrentIndex(currentIndex + 1);

      const chess = new Chess();
      line.game.moves.slice(0, currentIndex + 1).map((move: pgnParser.Move) => {
        chess.move(move.move);
      });

      chessboardRef.current?.position(chess.fen());
      gameRef.current = chess;

      const id = "button-nav-" + currentIndex;
      document.querySelector("#" + id)?.scrollIntoView();
    }
  };

  const [pressed, setPressed] = useState(false);
  const [value, setValue] = useState("");

  const onKeyDown = (e: any) => {
    setPressed(true);

    if (e.code === "Space") {
      setValue("space");

      return;
    }

    console.log("Got key", e);

    if (e.key === "ArrowRight") {
      goForward();
    } else if (e.key === "ArrowLeft") {
      goBack();
    }

    setValue(e.key);
  };
  const navigate = useNavigate();

  const [bindKeyDown, unbindKeyDown] = useEventListener({
    type: "keydown",
    listener: (e) => {
      onKeyDown(e);
    },
  });

  const [bindKeyUp, unbindKeyUp] = useEventListener({
    type: "keyup",
    listener: (e) => {
      setPressed(false);
    },
  });

  useEffect(() => {
    bindKeyDown();
    bindKeyUp();

    return () => {
      unbindKeyDown();
      unbindKeyUp();
    };
  }, [bindKeyDown, bindKeyUp, unbindKeyDown, unbindKeyUp]);

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

  const [cachedCommentNodes, setCachedCommentNodes] = useState<CommentNode[][]>(
    [],
  );

  useEffect(() => {
    console.log("Parsing comments");
    // setCachedCommentNodes({});

    let newCachedCommentNodes: CommentNode[][] = [];
    line.game.moves.map((move: Move, index: number) => {
      movesArray.push(move.move);

      if (move.move_number && move.move_number > lastMoveNumber) {
        lastMoveNumber = move.move_number;
      }

      const comments = move.comments
        ?.map((comment: any) => comment.text)
        .join(" ");

      const sections = parseComments(comments, line.game);

      newCachedCommentNodes[index] = sections;
    });

    console.log("Setting to ", newCachedCommentNodes);

    setCachedCommentNodes(newCachedCommentNodes);
  }, [line, line.game, lineToShow, setCachedCommentNodes]);

  const moves = line.game.moves.map((move: Move, index: number) => {
    movesArray.push(move.move);

    const thisLineSoFar = [...movesArray]; // don't get stuck
    let moveNumber = "";
    if (move.move_number && move.move_number > lastMoveNumber) {
      lastMoveNumber = move.move_number;
      moveNumber = `${lastMoveNumber}. `;
    }

    const sections = cachedCommentNodes[index];

    if (!sections) {
      return "";
    }

    // console.log("Got some sections", sections);

    const commentElements = (
      <>
        {sections.map((section: CommentNode, index: number) => {
          if (section.type === "Text" || section.type === "Unprocessed") {
            return section.text;
          } else if (section.type === "FEN" && section.fen) {
            let fen = section.fen;
            if (fen)
              return (
                <Button
                  className="p-0"
                  size="small"
                  text
                  onClick={() => {
                    setBoardFEN(fen);

                    console.log("Setting index to ", index);
                    setCurrentIndex(index);
                  }}
                >
                  {section.text}
                </Button>
              );
            return section.text;
          } else if (section.type === "Move") {
            let fen = section.fen;
            if (fen) {
              return (
                <Button
                  className="p-0"
                  size="small"
                  text
                  onClick={() => {
                    setBoardFEN(fen || "");
                    console.log("Setting index to ", index);
                    setCurrentIndex(index);
                  }}
                >
                  {section.text}
                </Button>
              );
            }

            return section.text;
          } else if (section.type === "Bold") {
            return <b>{section.text}</b>;
          }
        })}
      </>
    );

    const thereAreComments =
      sections.length > 1 ||
      (sections.length === 1 &&
        sections[0].type === "Text" &&
        sections[0].text !== "");

    const id = "button-nav-" + index;

    return (
      <>
        <span className={sections.length ? "align-items-center flex" : "none"}>
          <b>{move.move_number}</b>
          <Button
            pt={{ root: { id } }}
            className="p-2 font-bold ml-1"
            text={index + 1 !== currentIndex}
            size="small"
            outlined={index + 1 === currentIndex}
            onClick={() => {
              setBoard(thisLineSoFar);
              setCurrentIndex(thisLineSoFar.length);

              document.querySelector("#" + id)?.scrollIntoView(true);
            }}
          >
            {move.move}
          </Button>
        </span>

        {thereAreComments && Object.keys(cachedCommentNodes).length ? (
          <>
            <div className="col-12">{commentElements}</div>
          </>
        ) : (
          ""
        )}
      </>
    );
  });

  const [payload, setPayload] = useState<any>("");
  const [annotating, setAnnotating] = useState(false);

  if (annotating) {
    return (
      <AnnotationsFromPGN
        pgn={line.game}
        onClose={() => setAnnotating(false)}
      />
    );
  }

  return (
    <>
      <span style={{ float: "right" }} className="flex gap-2">
        <Button onClick={() => generateSVG(gameRef.current?.fen())}>
          Download SVG
        </Button>
        <Button onClick={() => setInverted(!inverted)}>Invert</Button>

        <Button
          onClick={() => {
            setAnnotating(true);
          }}
          label="Annotate"
          className="col-2 max-h-3rem"
        />
      </span>
      <br></br>
      <div className="inline">{board}</div>
      <br></br>
      <div
        id="comments-scroll-container"
        className="pt-1 overflow-scroll h-30rem max-h-30rem grid gap-3 row-gap-3 align-items-center"
      >
        {moves}
      </div>
      <Divider />
      <CommentsBox
        {...{ currentIndex, gameRef, line, repertoire, setPayload }}
      />
    </>
  );
}

function CommentsBox({
  currentIndex,
  gameRef,
  line,
  repertoire,
  setPayload,
}: any) {
  const [commentsBoxValue, setCommentsBoxValue] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    fetch("http://localhost:3001/notes?fen=" + gameRef.current?.fen())
      .then((a) => a.json())
      .then((a) => {
        console.log("FEN NOTE", a);
        if (a && a.notes) {
          setCommentsBoxValue(a.notes);
        }
      });
  }, [currentIndex]);

  return (
    <>
      <section className="inline-flex flex gap-3 flex-wrap col-12">
        <InputTextarea
          className="col-5"
          value={commentsBoxValue}
          onInput={(e: any) => {
            setCommentsBoxValue(e.target.value);
          }}
          rows={5}
          placeholder="Name"
        ></InputTextarea>
        <Button
          onClick={() => {
            const fen = gameRef.current?.fen();
            const original_location = "This site";
            const notes = commentsBoxValue;

            let move = "";

            try {
              const targetIndex = currentIndex;
              move = line.game.moves[targetIndex].move;
            } catch (e) {
              console.log("Unable to get move", e);
            }
            function shortenLine(input: string) {
              return input.replace(/[^A-Za-z0-9]/g, "");
            }

            const finalObject = {
              fen,
              move,
              notes,
              repertoire,
              original_location,
            };

            setPayload(finalObject);

            console.log(finalObject);

            fetch("http://localhost:3001/notes", {
              method: "POST",
              headers: {
                Accept: "*",
                "Content-Type": "application/json",
              },

              //make sure to serialize your JSON body
              body: JSON.stringify(finalObject),
            }).then((response) => {
              //do something awesome that makes the world a better place
              console.log("Got", response);
            });
          }}
          label="Save"
          className="col-2 max-h-3rem"
        />
        <Button
          onClick={() => {
            const fen = gameRef.current?.fen();
            if (fen) {
              checkLichess(fen);
            }
          }}
          label="Stats"
          className="col-2 max-h-3rem"
        />

        <Button
          onClick={() => {
            const fen = gameRef.current?.fen();
            if (fen) {
              window
                .open(
                  "https://lichess.org/analysis/" +
                    fen +
                    "?source=" +
                    repertoire,
                  "_blank",
                )
                ?.focus();
            } else {
              alert("Couldn't FEN");
            }
          }}
          label="Analysis Board"
          className="col-2 max-h-3rem"
        />
        <Button
          onClick={() => {
            const fen = gameRef.current?.fen();
            if (fen) {
              navigate("/book-it/searcher/?fen=" + fen);
            } else {
              alert("Couldn't FEN");
            }
          }}
          label="Search Games"
          className="col-2 max-h-3rem"
        />
      </section>
    </>
  );
}

async function checkLichess(fen: string) {
  let params =
    "variant=standard" +
    `&fen=${fen}` +
    "&speeds=blitz" +
    "&ratings=1800%2C2000%2C2200" +
    "&source=analysis";

  let finalURL = "https://explorer.lichess.ovh/lichess?" + params;

  console.log("Going to hit ", finalURL);

  fetch(finalURL)
    .then((response) => response.json())
    .then((json) => {
      console.log("Got lichess response", json);

      alert(
        "Total games from this position: " +
          (json.white + json.black + json.draws),
      );
    })
    .catch((error) => {
      console.log("Got lichess error", error);
    });
}
