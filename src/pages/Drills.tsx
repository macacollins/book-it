import {useState, useRef, Dispatch, SetStateAction} from 'react';

import AnalysisDatabase from '../types/AnalysisDatabase';
import Game from '../types/Game';
import Arrow from '../components/Arrow';
import ChessBoard from '../components/ChessBoard';
import {Chess} from 'chess.js';
import useWindowSize from '../hooks/useWindowSize'

import findTopOpenings from '../analysis/findTopOpenings';

// TODO make this happen 
type DrillMode = 'Unselected' | 'Frequency' | 'Time' | 'FromPosition';

export default function Drills(props:{analysisDatabase: AnalysisDatabase, games: any} ) {
    const analysisDatabase: AnalysisDatabase = props.analysisDatabase;
    const games = props.games;

    const width = useWindowSize()[0];

    const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
    const [currentDrillResult, setCurrentDrillResult] = useState("");

    const [currentOpeningFilter, setCurrentOpeningFilter] = useState("");
    const madeMove = useRef(false);

    //[{ [name: string]: Repertoire }, Dispatch<SetStateAction<{ [name: string]: Repertoire }>>] 
    const [ currentDrillMode, setCurrentDrillMode ] = 
            useState('Unselected');




    const frequencyTable: ({ [fen: string] : number }) = {};
    const gameLookup: ({ [fen: string] : Game }) = {};


    let finalGames: Game[] = [];

    let normalGames = (games && games.filter &&
        games.filter((nextGame: Game) => {
            return analysisDatabase[nextGame.url] && analysisDatabase[nextGame.url].youLeftBook && analysisDatabase[nextGame.url].foundIntersection
        })) || [];

    if (currentDrillMode === 'Unselected') {

        let topOpenings = findTopOpenings(normalGames, analysisDatabase).slice(0, 14);

        let openingFilters = topOpenings.map(({opening, count}) =>
            <md-select-option data-testid={`opening-${opening}`}
                            key={opening}
                            value={opening}
                            onClick={() => {
                                setCurrentOpeningFilter(opening)
                            }}>
                {opening} {count}
            </md-select-option>
        );

        const openingFiltersFull = <><h3>Opening Filter</h3>
            <md-outlined-select>
                {openingFilters}
            </md-outlined-select>
        </>
        
        return (<>

            <md-filled-button
                data-testid={"time-button"}
                className={"time-button"}
                onClick={() => {
                    setCurrentDrillMode('Time');
                }}>
                Time
            </md-filled-button>

            <md-filled-button
                data-testid={"frequency-button"}
                className={"frequency-button"}
                onClick={() => {
                    setCurrentDrillMode('Frequency');
                }}>
                Frequency
            </md-filled-button>

            <md-filled-button
                data-testid={"from-position-button"}
                className={"from-position-button"}
                onClick={() => {
                    setCurrentDrillMode('FromPosition');
                }}>
                From Position
            </md-filled-button>

            { openingFiltersFull }
        </>)
    } else if (currentDrillMode === 'Time') {
        finalGames = normalGames
    } else if (currentDrillMode === 'FromPosition') {
        finalGames = normalGames.filter((game: Game) => {
            return analysisDatabase[game.url].openingFamily === currentOpeningFilter;
        })
    } else if (currentDrillMode === 'Frequency') {
        // TODO take this out of the render loop; a useEffect hook with buttons for what type of drill
        // is prolly the right way to do it
        if (games && games.filter) {

            games.filter((nextGame: Game) => {
                return analysisDatabase[nextGame.url] && analysisDatabase[nextGame.url].youLeftBook && analysisDatabase[nextGame.url].foundIntersection
            }).forEach( (game: Game) => {

                let activeFEN = analysisDatabase[game.url].displayFEN;

                if (frequencyTable[activeFEN]) {
                    frequencyTable[activeFEN] = frequencyTable[activeFEN] + 1
                } else {
                    frequencyTable[activeFEN] = 1
                    gameLookup[activeFEN] = game;
                }
            })

            function frequencyComparison(a: string, b: string) {
                return frequencyTable[b] - frequencyTable[a]
            }

            finalGames = Object.keys(gameLookup).sort(frequencyComparison).map(fen => gameLookup[fen]);
        }

        console.log("Got sorted games. Top 3 games below.")

        let firstGameAscii = new Chess(finalGames[0].fen).ascii();

        console.log(`With ${frequencyTable[finalGames[0].fen]} results`, firstGameAscii)

        if (finalGames.length > 2) {
            let secondGameAscii = new Chess(finalGames[1].fen).ascii();
            let thirdGameAscii = new Chess(finalGames[2].fen).ascii();

            console.log(`With ${frequencyTable[finalGames[1].fen]} results`, secondGameAscii)
            console.log(`With ${frequencyTable[finalGames[2].fen]} results`, thirdGameAscii)
        }
    }

    const maybeNextGame : Game | undefined = 
        finalGames.length > currentDrillIndex ?
            finalGames[currentDrillIndex] :
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
                    {frequencyTable[drillAnalysisResult.displayFEN]}
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
