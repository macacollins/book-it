import Arrow from "./Arrow";
import ChessBoard from "./ChessBoard";
import useWindowSize from "../hooks/useWindowSize";

import Game from "../types/Game";
import AnalysisDatabase from "../types/AnalysisDatabase";

import { Button } from 'primereact/button';
import { useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import { Chess } from "chess.js";

interface AnalysisResultPropTypes {
  analysisDatabase: AnalysisDatabase;
  game: Game;
  index: number;
  nameOverride: string;
}

const AnalysisResult = ({
  analysisDatabase,
  game,
  index,
  nameOverride = "my-name",
}: AnalysisResultPropTypes) => {

  const chessboardRef = useRef<any>();

  const width = useWindowSize()[0];

  useEffect(() => {
    if (chessboardRef.current) {
      chessboardRef.current?.resize();
    }
  }, []);


  const navigate = useNavigate();

  if (typeof game === "undefined") {
    return (
      <li key={index}>
        <div slot="headline">
          Loading Analysis for game
          {game}
        </div>
      </li>
    );
  }

  // display code stays under this line
  let analysis = analysisDatabase[game.url];

  if (!analysis) {
    return (
      <li key={index}>
        <div slot="headline">
          Loading Analysis for game
          {game.url}
        </div>
      </li>
    );
  }

  let arrows = analysis.arrows.map((arrow, index) => (
    <Arrow key={index} {...{ index, hidden: false, ...arrow }}></Arrow>
  ));

  let openingName;
  if (analysis.headers.ECOUrl) {
    const path = new URL(analysis.headers.ECOUrl).pathname;

    // Get the last path segment and replace hyphens with spaces
    openingName = path.split("/")?.pop()?.replace(/-/g, " ");
  } else {
    openingName = "";
  }

  let widthOfChessboard = Math.min(width, 513);

  let actualChessboardWidth =
    widthOfChessboard % 8 === 0
      ? widthOfChessboard - 8
      : widthOfChessboard - (widthOfChessboard % 8);

  let buttonStyles = {
    width: actualChessboardWidth + "px",
  };

  return (

    <div key={index} className="w-full flex flex-column align-items-center justify-content-center">
      <div slot="headline">
        {analysis.headers.White}
        {" vs "}
        {analysis.headers.Black}
        {"\n"}
        {analysis.headers.Result}
      </div>
      <div className="p-3">{analysis.advice}</div>
      <div slot="supporting-text">
        <div className="side-by-side">
          
          <ChessBoard
            fen={analysis.displayFEN}
            invert={analysis.invert_board}
            name={nameOverride}
            game_url={game.url}
            arrows={arrows}
            chessboardRef={chessboardRef}
            size={widthOfChessboard + "px"}
          ></ChessBoard>
        </div>
        <br></br>
        <div className="w-full flex align-items-center justify-content-center gap-3 mb-5" style={buttonStyles}>
          <Button
            data-testid={"chess-dot-com-button"}
            onClick={() =>
              window.open("/book-it/tv?fen=" + analysis.displayFEN)
            }
          >
            TV
          </Button>
          <Button
            data-testid={"lichess-button"}
            onClick={() =>
              window.open("https://lichess.org/analysis/" + analysis.displayFEN)
            }
          >
            Lichess
          </Button>
          <Button
            data-testid={"chessable-button"}
            onClick={() =>
              window.open(
                "https://www.chessable.com/courses/fen/" + analysis.displayFEN,
              )
            }
          >
            Chessable
          </Button>
          <Button
            data-testid={"notes-button"}
            onClick={() => {
              const id = game.url.slice(game.url.length - 8);
              console.log("Value was", id )
              navigate(`/book-it/annotations/` + id)
            }

              
            }
          >
            Notes
          </Button>
          <br></br>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
