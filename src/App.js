import logo from './logo.svg';
import './App.css';

import {useState, useEffect} from 'react';

import {Chess} from 'chess.js'

// index.js
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/button/elevated-button.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/textfield/outlined-text-field.js';

function App() {

    const [games, setGames] = useState([]);
    const [repertoire, setRepertoire] = useState([]);

    // structure is game url -> analysis objects
    // { game_url: {
    //      we_left_book: true
    //      left_at_move: 5
    //      fen_at_departure: "q321523t"
    // }
    //
    const [analysisDatabase, setAnalysisDatabase ] = useState({})

    function refreshGames() {
        console.log("Fetching games from chess.com");
        // start request to chess.com for data
        fetch('https://api.chess.com/pub/player/***REMOVED***/games/2024/01')
            .then((res) => res.json())
            .then((data) => {
                //console.log(data);
                const games = data.games;

                games.reverse();
                setGames(games.slice(0, 10));
                localStorage.setItem('games', JSON.stringify(games));
            })
            .catch((err) => {
                console.log(err.message);
            });

    }

    useEffect(() => {
        if (localStorage.getItem('analysisDatabase')) {
            setAnalysisDatabase(JSON.parse(localStorage.getItem('analysisDatabase')))
        }

        if (localStorage.getItem('repertoire')) {
            setRepertoire(JSON.parse(localStorage.getItem('repertoire')))
        }

        if (localStorage.getItem('games')) {
            // use local games
            setGames(JSON.parse(localStorage.getItem('games')));
        } else {
            refreshGames();
        }

    }, []);


    useEffect(() => {
        console.log("Calculating analysis")

        // put on the queue
        setTimeout(() => {
            setAnalysisDatabase(calculateAnalysis(analysisDatabase, repertoire, games));
        }, 0)

        }, // end useEffect
        [repertoire, games]
    )


    let listItems = games && games.map && games.map(game => {
        // display code stays under this line
        let analysis = analysisDatabase[game.url];

        if (!analysis) {
            return <md-list-item>
                <div slot="headline">
                    Loading Analysis for game
                    {game.url}
                </div>
            </md-list-item>
        }

        let arrows = analysis.arrows.map(arrow => <Arrow {...arrow} ></Arrow>);


        return <md-list-item>
            <div slot="headline">{analysis.headers.White}{' vs '}{analysis.headers.Black}{'\n'}
                {analysis.headers.Result}
            </div>
            <div slot="supporting-text">
                <div className="side-by-side">
                    {'End Position'}
                    <TestBoard fen={analysis.displayFEN} invert={analysis.invert_board} name="my-board" game_url={game.url}
                               arrows={arrows}></TestBoard>
                </div>
                {/*
          <div className="side-by-side">
              {'Your book has this move'}
              <TestBoard name="my-second-board"></TestBoard>
          </div>
          */}
                <div className="buttonlist">
                    <md-text-button onClick={() => window.open(analysis.headers.Link)}>Chess.com</md-text-button>
                    <md-text-button
                        onClick={() => window.open('https://lichess.org/analysis/' + analysis.displayFEN)}>Lichess
                        Analysis
                    </md-text-button>
                    <md-text-button
                        onClick={() => window.open('https://www.chessable.com/courses/fen/' + analysis.displayFEN)}>Chessable
                        Course Search
                    </md-text-button>
                    <br></br>
                    {analysis.advice}
                </div>
            </div>
            <div slot="trailing-supporting-text">
            </div>
        </md-list-item>
    });

    return (
        <>
            {'Enter your lines here'}
            <FileUpload setRepertoire={setRepertoire}> </FileUpload>
            <md-filled-button onClick={refreshGames}>Refresh games</md-filled-button>
            <md-list>
                {listItems}
            </md-list>

            <label>
                Material 3
                <md-checkbox checked></md-checkbox>
            </label>

            <md-outlined-button>Back</md-outlined-button>
            <md-filled-button>Next</md-filled-button>
        </>
    );
}


const TestBoard = ({
                       name, game_url, invert = false, fen = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R', arrows = []
                   }) => {
    const finalID = name + game_url.replace(/[^a-zA-Z0-9]/g, '');
    // Initialize the board after the component mounts to the DOM
    useEffect(() => {
        setTimeout(() => {

            var config = {
                position: fen,
//                orientation: invert ? 'white' : 'black'

            }

            /*global Chessboard */
            console.log(finalID);
            var board = Chessboard(finalID, config);

            // console.log("board", board);

            if (invert) {
                board.flip();
            }

            const box_size = 49
        }, 100);
    }, []);


    return (
        <>
            <div>
                <Drawings arrows={arrows}> </Drawings>
                <div id={finalID} style={{"height": "388px", "width": "388px"}}>
                </div>
            </div>
        </>
    );
}

// cartesian x y to svg
const Arrow = ({fromX, fromY, destX, destY, color = 'red'}) => {

    const targetX1 = fromX - 4.5;
    const targetX2 = destX - 4.5;
    const targetY1 = 4.5 - fromY;
    const targetY2 = 4.5 - destY;

    const markerEnd = color === 'red' ? 'url(#arrowhead-r)' : 'url(#arrowhead-g)';

    return <g>
        <g>
            <line stroke={color} stroke-width="0.15625" stroke-linecap="round" marker-end={markerEnd} opacity="1"
                  x1={targetX1} y1={targetY1} x2={targetX2} y2={targetY2}></line>
        </g>
    </g>

    // return <g><g><line id="test-id" stroke="#15781B" stroke-width="0.15625" stroke-linecap="round" marker-end="url(#arrowhead-g)" opacity="1" d={"M -0.5 2.5 L -0.5 0.65625 z"}></line></g></g>
};

const Circle = ({x, y}) => {
    //return <g><circle stroke="#15781B" stroke-width="0.0625" fill="none" opacity="1" cx="-0.5" cy="2.5" r="0.46875"></circle></g></g>
}
const Drawings = ({arrows, circles}) => {
    return (
        <svg class="cg-shapes" viewBox="-4 -4 8 8" preserveAspectRatio="xMidYMid slice">
            <defs>
                <filter id="cg-filter-blur">
                    <feGaussianBlur stdDeviation="0.019"></feGaussianBlur>
                </filter>
                <marker id="arrowhead-g" orient="auto" overflow="visible" markerWidth="4" markerHeight="4" refX="2.05"
                        refY="2" cgKey="g">
                    <path d="M0,0 V4 L3,2 Z" fill="green"></path>
                </marker>
                <marker id="arrowhead-r" orient="auto" overflow="visible" markerWidth="4" markerHeight="4" refX="2.05"
                        refY="2" cgKey="pb">
                    <path d="M0,0 V4 L3,2 Z" fill="red"></path>
                </marker>
            </defs>
            {arrows}
            {circles}
        </svg>

    )
}

const FileUpload = ({setRepertoire}) => {
    useEffect(() => {
        function handleFile(event) {
            const fileInput = event.target;
            const file = fileInput.files[0];

            if (file) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    const fileContents = e.target.result;
                    //console.log("File Contents as String:", fileContents);

                    const lines = fileContents.split('\n');


                    // { [fen]: [ line, line, line, line ] }
                    let fenRepo = {};


                    // Process each line in a for loop
                    for (let i = 0; i < lines.length; i++) {
                        const currentLine = lines[i].trim();

                        console.log(`Processing line ${i + 1}: ${currentLine}`);

                        let this_chess = new Chess();
                        this_chess.loadPgn(currentLine);

                        console.log(this_chess);

                        let history = this_chess.history();

                        let step_by_step_history = new Chess();

                        for (let j = 0; j < history.length; j++) {

                            step_by_step_history.move(history[j]);

                            if (fenRepo[step_by_step_history.fen()]) {
                                fenRepo[step_by_step_history.fen()].push(currentLine);
                            } else {
                                fenRepo[step_by_step_history.fen()] = [currentLine];
                            }
                        }


                    }

                    console.log("Setting repertoire");
                    setRepertoire(fenRepo);
                    localStorage.setItem('repertoire', JSON.stringify(fenRepo));

                };

                // Read the file as a text
                reader.readAsText(file);
            }
        }

        document.getElementById('fileInput').addEventListener('change', handleFile);
    }, [])

    return <form>
        <label for="fileInput">Choose a file:</label>
        <input type="file" id="fileInput" name="fileInput"></input>
    </form>
}

function calculateAnalysis(current_analysis, repertoire, games) {

    let analysisDatabase = JSON.parse(localStorage.getItem("analysisDatabase")) || {};

    let thisRepertoire = repertoire;

    let moveArrow;

    if (JSON.stringify(thisRepertoire) !== "{}") {
        games && games.map && games.forEach(game => {

            if (current_analysis[game.url]) {
                // skip for now. We can consider reworking this system when lines are more dynamically updated.
                console.log(`Found analysis for ${game.url}`);
                return
            }

            console.log(`calculating analysis for ${game.url}`);

            //console.log(game.pgn);
            //console.log(new Chess());
            // this is single analysis for one game
            const analysis = {arrows: [], notes: "No notes found."}
            let chess_game = new Chess();
            chess_game.loadPgn(game.pgn);

            // TODO unhardcode
            let invert_board = chess_game.header().Black === '***REMOVED***';

            let foundIntersection = false;


            let last_moves = [];
            let finalMoveIndex = 0;

            let chess_game_step_by_step = new Chess();
            let last_position = new Chess();
            let checkFurther = false;

            // attempt to rewind to last theory spot
            for (let i = 0; i < chess_game.history().length; i++) {

                let move_made = chess_game_step_by_step.move(chess_game.history()[i]);

                let fen = chess_game_step_by_step.fen();

                if (thisRepertoire[fen]) {
                    // recognized at least one
                    checkFurther = true;
                }
                if (checkFurther && !thisRepertoire[fen]) {
                    //console.log("Couldn't find ", chess_game_step_by_step.ascii())
                    let lines = thisRepertoire[last_position.fen()] || [];
                    finalMoveIndex = i;

                    //console.log("Left at line", finalMoveIndex);
                    //console.log("Lines are", lines);
                    let next_moves = lines.map(line => {
                        let line_game = new Chess();
                        line_game.loadPgn(line);

                        let step_by_step_line = new Chess();
                        for (let j = 0; j < line_game.history().length; j++) {
                            let move = line_game.history()[j];

                            if (step_by_step_line.fen() === last_position.fen()) {
                                // we are there
                                last_moves.push(move);
                                break;

                            } else {
                                // make the move
                                step_by_step_line.move(move);
                            }

                        }
                    });

                    foundIntersection = true;
                    analysis.foundIntersection = true;

                    let [fromX, fromY] = square_to_coordinates(move_made.from);
                    let [toX, toY] = square_to_coordinates(move_made.to);

                    analysis.invert_board = invert_board;
                    if (invert_board) {
                        toY = 9 - toY;
                        fromY = 9 - fromY;
                        toX = 9 - toX;
                        fromX = 9 - fromX;
                    }

                    let arrowConfig = {
                        color: "red",
                        fromX, fromY,
                        destX: toX,
                        destY: toY
                    }

                    analysis.arrows.push(arrowConfig)

                    break;
                }

                last_position.move(chess_game.history()[i]);
            }

            if (foundIntersection) {
                last_moves = [...new Set(last_moves)];
            }

            let next_move_arrows = last_moves.map(last_move => {
                let cloned_game = new Chess(last_position.fen());

                let move = cloned_game.move(last_move);

                // console.log("Got a move:", move);

                let [fromX, fromY] = square_to_coordinates(move.from);
                let [toX, toY] = square_to_coordinates(move.to);

                if (invert_board) {
                    toY = 9 - toY;
                    fromY = 9 - fromY;
                    toX = 9 - toX;
                    fromX = 9 - fromX;
                }

                const arrowConfig = {
                    color: "green",
                    fromX,
                    fromY,
                    destX: toX,
                    destY: toY
                }

                analysis.arrows.push(arrowConfig);
            });

            let chess_game_display = new Chess();

            for (let i = 0; i < finalMoveIndex; i++) {
                chess_game_display.move(last_position.history()[i]);
            }

            if (!foundIntersection) {
                chess_game_display.loadPgn(game.pgn)
                //console.log("No intersection, loaded pgn instead");
            }

            next_move_arrows.push(moveArrow);

            let advice = 'No advice found.';

            analysis.result = chess_game.header().Result

            analysis.fen_at_departure = chess_game_display.fen();
            analysis.you_left_book =
                chess_game.header().White === "***REMOVED***" &&
                chess_game_display.turn() === "w";

            if (analysis.you_left_book) {
                advice = "You left book on this one. Study the lines from the repertoire."
            } else {
                advice = "They left book. Consider analyzing the move to get an idea of how to play against it."

            }

            // console.log("turn()", chess_game.turn());
            // console.log(game);

            analysis.advice = advice;
            analysis.displayFEN = chess_game_display.fen();

            analysis.headers = chess_game.header();

            analysisDatabase[game.url] = analysis;

        })


        if (analysisDatabase) {
            console.log("Writing analysis to localStorage", analysisDatabase);

            localStorage.setItem("analysisDatabase", JSON.stringify(analysisDatabase));
        }
    }


    return analysisDatabase;
}

function square_to_coordinates(inputString) {
    // Check if the input string is valid

    // Extract letter and number
    const letter = inputString.charAt(0);
    const number = parseInt(inputString.charAt(1));

    // Calculate the index of the letter (a=1, b=2, ..., h=8)
    const letterIndex = letter.charCodeAt(0) - 'a'.charCodeAt(0) + 1;

    // Return a list with the calculated values
    return [letterIndex, number];
}

export default App;
