import {useState, useRef} from 'react';

import AnalysisDatabase from '../types/AnalysisDatabase';
import Game from '../types/Game';
import Arrow from '../components/Arrow';
import ChessBoard from '../components/ChessBoard';
import {Chess} from 'chess.js';
import useWindowSize from '../hooks/useWindowSize'

export default function Drills(props:{analysisDatabase: AnalysisDatabase, games: any} ) {
    const analysisDatabase: AnalysisDatabase = props.analysisDatabase;
    const games = props.games;

    const width = useWindowSize()[0];

    const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
    const [currentDrillResult, setCurrentDrillResult] = useState("");

    const madeMove = useRef(false);

    const filteredGames = (games && games.filter &&
        games.filter((nextGame: Game) => {
            return analysisDatabase[nextGame.url] && analysisDatabase[nextGame.url].youLeftBook && analysisDatabase[nextGame.url].foundIntersection
        })) || []

    const maybeNextGame : Game | undefined = 
        filteredGames.length > currentDrillIndex ?
            filteredGames[currentDrillIndex] :
            undefined;


    let drillBoard = <></>;
    let drillCurrentDisplay = <></>;

    let widthOfChessboard = Math.min(width - 36, 513);

    let actualChessboardWidth =
        widthOfChessboard % 8 === 0 ?
            widthOfChessboard - 8 :
            widthOfChessboard - (widthOfChessboard % 8);

    let buttonStyles = {
        "width": actualChessboardWidth + "px"
    }

    // console.log("Next game", nextGame);
    if (typeof maybeNextGame !== "undefined") {
        const nextGame: Game = maybeNextGame;

        const drillAnalysisResult = analysisDatabase[nextGame.url];

        const chessJSGame = new Chess();
        chessJSGame.loadPgn(nextGame.pgn);

        const moves = chessJSGame.history().slice(0, drillAnalysisResult.finalMoveIndex);

        drillBoard = <md-list-item>
            <div slot="supporting-text">
                <div className="side-by-side">
                    <ChessBoard fen={'start'}
                                moves={moves}
                                invert={drillAnalysisResult.invert_board}
                                name={"drill-board" + currentDrillIndex}
                                game_url={nextGame.url + "drillresult"}
                                draggable={!currentDrillResult}
                                arrows={currentDrillResult ? drillAnalysisResult.arrows.map((arrow: any) =>
                                    <Arrow {...arrow}></Arrow>) : []}
                                madeMoveRef={madeMove}
                                moveCallback={move => {
                                    // console.log(drillAnalysisResult.arrows);
                                    // console.log(move);

                                    let filtered =
                                        drillAnalysisResult
                                            .arrows
                                            .filter((arrow: any) => arrow.color === "green")
                                            .filter((arrow: any) => arrow.san === move.san);

                                    if (filtered.length > 0) {
                                        // console.log("Success, " + move.san + " was the right move.");
                                        setCurrentDrillResult("Success");
                                    } else {
                                        // console.log("failure, was expecting another move")
                                        setCurrentDrillResult("Failure")
                                    }

                                    madeMove.current = true;
                                }}
                    ></ChessBoard>
                </div>
                <br></br>
                {/*<p><a href={"https://lichess.org/opening/" + openingName}>{drillAnalysisResult.headers.ECO} {openingName}</a></p>*/}
                <div className="buttonlist" style={buttonStyles}>
                    <md-text-button
                        data-testid={"chess-dot-com-button"}
                        onClick={() => window.open(drillAnalysisResult.headers.Link)}>
                        Chess.com
                    </md-text-button>
                    <md-text-button
                        data-testid={"lichess-button"}
                        onClick={() => window.open('https://lichess.org/analysis/' + drillAnalysisResult.displayFEN)}>
                        Lichess
                    </md-text-button>
                    <md-text-button
                        data-testid={"chessable-button"}
                        onClick={() => window.open('https://www.chessable.com/courses/fen/' + drillAnalysisResult.displayFEN)}>Chessable

                    </md-text-button>
                    <br></br>

                </div>
            </div>
        </md-list-item>

        if (currentDrillResult === "Failure") {
            drillCurrentDisplay = <>
                <p style={{"lineHeight": "36px"}}>{"Oops, better study on this one."}
                    <md-filled-button
                        data-testid={"next-button"}
                        onClick={() => {
                        setCurrentDrillIndex(currentDrillIndex + 1);
                        setCurrentDrillResult("");
                        madeMove.current = false;
                    }}>Next
                    </md-filled-button>
                </p>
            </>

        } else if (currentDrillResult === "Success") {
            drillCurrentDisplay = <>
                <p style={{"lineHeight": "36px"}}>{"Congrats, you did it!"}
                    <md-filled-button
                        data-testid={"next-button"}
                        className={"drill-button"}
                        onClick={() => {
                            setCurrentDrillIndex(currentDrillIndex + 1);
                            setCurrentDrillResult("")
                            madeMove.current = false;
                        }}>
                        Next

                    </md-filled-button>
                </p>
            </>

        }
    }

    return <>
        {drillBoard}
        {drillCurrentDisplay}
    </>
};
