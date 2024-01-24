import {useState, useRef} from 'react';

import Arrow from '../components/Arrow';
import ChessBoard from '../components/ChessBoard';
import {Chess} from 'chess.js';


export default function Drills({games = [], analysisDatabase}) {
    const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
    const [currentDrillResult, setCurrentDrillResult] = useState("");

    const madeMove = useRef(false);

    const filteredGames = games && games.filter &&
        games.filter(nextGame => {
            return analysisDatabase[nextGame.url] && analysisDatabase[nextGame.url].youLeftBook && analysisDatabase[nextGame.url].foundIntersection
        })

    const nextGame =
        filteredGames.length > currentDrillIndex ?
            filteredGames[currentDrillIndex] :
            undefined;


    let drillBoard = '';
    let drillCurrentDisplay = ''


    // console.log("Next game", nextGame);
    if (nextGame && nextGame.url) {

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
                                arrows={currentDrillResult ? drillAnalysisResult.arrows.map(arrow =>
                                    <Arrow {...arrow}></Arrow>) : []}
                                madeMoveRef={madeMove}
                                moveCallback={move => {
                                    console.log(drillAnalysisResult.arrows);
                                    console.log(move);

                                    let filtered =
                                        drillAnalysisResult
                                            .arrows
                                            .filter(arrow => arrow.color === "green")
                                            .filter(arrow => arrow.san === move.san);

                                    if (filtered.length > 0) {
                                        console.log("Success, " + move.san + " was the right move.");
                                        setCurrentDrillResult("Success");
                                    } else {
                                        console.log("failure, was expecting another move")
                                        setCurrentDrillResult("Failure")
                                    }

                                    madeMove.current = true;
                                }}
                    ></ChessBoard>
                </div>
                {/*<p><a href={"https://lichess.org/opening/" + openingName}>{drillAnalysisResult.headers.ECO} {openingName}</a></p>*/}
                <div className="buttonlist">
                    <md-text-button
                        data-testid={"chess-dot-com-button"}
                        onClick={() => window.open(drillAnalysisResult.headers.Link)}>
                        Chess.com
                    </md-text-button>
                    <md-text-button
                        data-testid={"lichess-button"}
                        onClick={() => window.open('https://lichess.org/analysis/' + drillAnalysisResult.displayFEN)}>
                        Lichess Analysis
                    </md-text-button>
                    <md-text-button
                        data-testid={"chessable-button"}
                        onClick={() => window.open('https://www.chessable.com/courses/fen/' + drillAnalysisResult.displayFEN)}>Chessable
                        Course Search
                    </md-text-button>
                    <br></br>

                </div>
            </div>
            <div slot="trailing-supporting-text">
            </div>
        </md-list-item>

        if (currentDrillResult === "Failure") {
            drillCurrentDisplay = <>
                <p style={{"line-height": "36px"}}>{"Oops, better study on this one."}
                    <md-filled-button
                        data-testid={"next-button"}
                        onClick={() => {
                        setCurrentDrillIndex(currentDrillIndex + 1);
                        setCurrentDrillResult(undefined);
                        madeMove.current = false;
                    }}>Next
                    </md-filled-button>
                </p>
            </>

        } else if (currentDrillResult === "Success") {
            drillCurrentDisplay = <>
                <p style={{"line-height": "36px"}}>{"Congrats, you did it!"}
                    <md-filled-button
                        data-testid={"next-button"}
                        className={"drill-button"}
                        onClick={() => {
                            setCurrentDrillIndex(currentDrillIndex + 1);
                            setCurrentDrillResult(undefined);
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