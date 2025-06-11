import Arrow from "./Arrow";
import ChessBoard from "./ChessBoard";
import useWindowSize from "../hooks/useWindowSize";

import Game from "../types/Game";
import AnalysisDatabase from "../types/AnalysisDatabase";

import { Button } from 'primereact/button';
import { useNavigate } from "react-router";
import { useEffect } from "react";

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
  const width = useWindowSize()[0];

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

  let widthOfChessboard = Math.min(width - 36, 513);

  let actualChessboardWidth =
    widthOfChessboard % 8 === 0
      ? widthOfChessboard - 8
      : widthOfChessboard - (widthOfChessboard % 8);

  let buttonStyles = {
    width: actualChessboardWidth + "px",
  };

  return (
    <li key={index}>
      <div slot="headline">
        {analysis.headers.White}
        {" vs "}
        {analysis.headers.Black}
        {"\n"}
        {analysis.headers.Result}
      </div>
      <div slot="supporting-text">
        <div className="side-by-side">
          {analysis.advice}
          <p>
            {analysis.headers.ECO} {openingName}
          </p>
          <ChessBoard
            fen={analysis.displayFEN}
            invert={analysis.invert_board}
            name={nameOverride}
            game_url={game.url}
            arrows={arrows}
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
            onClick={() =>
              navigate(`/book-it/annotations?gameURL=${game.url}`)
            }
          >
            Notes
          </Button>
          <br></br>
        </div>
      </div>
    </li>
  );
};

export default AnalysisResult;
