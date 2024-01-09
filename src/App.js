import './App.css';

import {useState, useEffect} from 'react';
import { setItemGZIP } from './storage';

// index.js
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/button/elevated-button.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/radio/radio.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/secondary-tab.js';
import '@material/web/tabs/tabs.js';

import AnalysisResult from './components/AnalysisResult';
import Arrow from './components/Arrow';
import ChessBoard from './components/ChessBoard';
import FileUpload from './components/FileUpload';
import calculateAnalysis from './analysis/calculateAnalysis';
import refreshGames from './integrations/chess.com'
import loadCachedData from './loadCachedData';

import defaultLines from './integrations/default-lines';

function App({
                 analysisDatabaseStorage,
                 repertoireStorage,
                 gamesStorage,
                 playerNameStorage,
                 repertoireListStorage,
                 matchingMovesStorage,
                 userLeftBookOnlyStorage,
                 repertoireChoiceStorage
             }) {

    const [games, setGames] = useState(gamesStorage || []);
    const [repertoire, setRepertoire] = useState(repertoireStorage || {"Default Lines": defaultLines});
    const [analysisDatabase, setAnalysisDatabase] = useState(analysisDatabaseStorage || {});

    const [userLeftBookOnly, setUserLeftBookOnly] = useState(userLeftBookOnlyStorage || true);
    const [repertoireChoice, setRepertoireChoice] = useState(repertoireChoiceStorage || "Default Lines");
    const [repertoireList, setRepertoireList] = useState(repertoireListStorage || ["Default Lines"]);
    const [newRepertoireNameField, setNewRepertoireNameField] = useState("");
    const [playerName, setPlayerName] = useState(playerNameStorage || "")
    const [matchingMoves, setMatchingMoves] = useState(matchingMovesStorage || 3)

    // tab navigation
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
            console.log("Calculating analysis")

            // put on the queue
            setTimeout(() => {
                calculateAnalysis(analysisDatabase, repertoire, games, setAnalysisDatabase, playerName);
            }, 0);
        }, [repertoire, games]
    )

    let listItems = games && games.filter &&
        games.filter(game => {
            if (userLeftBookOnly) {
                return analysisDatabase[game.url] && analysisDatabase[game.url].you_left_book
            }
            return true;
        }).map(singleGame => {
            if (singleGame) {
                return <AnalysisResult game={singleGame} analysisDatabase={analysisDatabase}></AnalysisResult>
            } else {
                return "No game found"
            }
        }) || [];


    const leftBookCheckbox = userLeftBookOnly ?
        <md-checkbox
            checked={userLeftBookOnly}
            onClick={() => {
                setUserLeftBookOnly(!userLeftBookOnly)
                setItemGZIP("userLeftBookOnly", !userLeftBookOnly);
            }}>
        </md-checkbox>
        :
        <md-checkbox
            onClick={() => {
                setUserLeftBookOnly(!userLeftBookOnly)
                setItemGZIP("userLeftBookOnly", !userLeftBookOnly);
            }}>
        </md-checkbox>

    const resultsPage = <>
        <h2>Results</h2>
        <p>Reviewing lines from repertoire "{repertoireChoice}" as {playerName}</p>
        <p>This is a list of games at the position where they left the book.</p>
        <label>
            Show only lines where you left book first
            {leftBookCheckbox}
        </label>
        <br></br>
        <md-filled-button onClick={() => { refreshGames(games, setGames, playerName) }}>Refresh games</md-filled-button>

        <p>Found {listItems.length} results.</p>
        <md-list>
            {/*{listItems}*/}
        </md-list>
    </>;


    const checkboxItems =
        (repertoireList && repertoireList.map && repertoireList || []).map(repertoireName => {
            const kebabed = repertoireName;

            const props = repertoireName === repertoireChoice ? ({
                "checked" : true,
                "touch-target": "wrapper"
            }) : {
                "touch-target": "wrapper"
            };

            return <div class="radio-label">
                <md-radio
                    aria-label={repertoireName}
                    onClick={() => {

                        setRepertoireChoice(repertoireName);
                        setItemGZIP("repertoireChoice", repertoireName);
                    }}
                    id="default-lines-radio"
                    name="with-labels"
                    {... props}>
                </md-radio>
                <label for="default-lines-radio">{repertoireName}</label>
            </div>
        })

    console.log("new repertoire name field is ", newRepertoireNameField);

    const configPage = <>
        <h2>Configuration</h2>

        <h3>User</h3>
        <p>Please enter your chess.com username.</p>


        <md-outlined-text-field
            label="chess.com Username"
            value={playerName}
            onInput={e => {
                setPlayerName(e.target.value);
                setItemGZIP("playerName", e.target.value);
            }}>
        </md-outlined-text-field>

        <h3>Repertoire</h3>
        <div class="column" role="radiogroup" aria-label="Repertoire">
            {checkboxItems}
        </div>

        <h3>Upload New Lines</h3>

        <md-outlined-text-field
            label="Repertoire Name"
            value={newRepertoireNameField}

            onInput={e => {
                setNewRepertoireNameField(e.target.value);
                console.log("set it to ", e.target.value);

            }}>
        </md-outlined-text-field>
        <br></br>
        <FileUpload
            newRepertoireNameField={newRepertoireNameField}
                    {...{
            repertoire,
            setRepertoire,
            setNewRepertoireNameField,
            repertoireList,
            setRepertoireList
        }}> </FileUpload>

        <h3>Settings</h3>

        <br></br>

        <label>
            Show lines that have at least this many matching moves
        </label>
        <md-outlined-text-field
            label="Matching Moves"
            value={matchingMoves}
            type="number"
            onInput={e => {
                setMatchingMoves(e.target.value);
                setItemGZIP("matchingMoves", e.target.value);
            }}>
        </md-outlined-text-field>

        <br></br>
    </>

    const [ currentDrillIndex, setCurrentDrillIndex ] = useState(0);
    const [ currentDrillResult, setCurrentDrillResult ] = useState("");


    const filteredGames = games && games.filter &&
        games.filter(nextGame => {
            return analysisDatabase[nextGame.url] && analysisDatabase[nextGame.url].you_left_book
        });

    const nextGame =
        filteredGames.length > currentDrillIndex ?
            filteredGames[currentDrillIndex] :
            undefined;

    let nextDrill = <p>You haven't left book yet, or haven't played enough games. Try Configuration.</p>
    let drillBoard = '';
    let drillCurrentDisplay = ''
    if (nextGame && nextGame.url) {

        const drillAnalysisResult = analysisDatabase[nextGame.url];

        drillBoard = <md-list-item>
            <div slot="headline">{drillAnalysisResult.headers.White}{' vs '}{drillAnalysisResult.headers.Black}{'\n'}
                {drillAnalysisResult.headers.Result}
            </div>
            <div slot="supporting-text">
                <div className="side-by-side">
                    {drillAnalysisResult.advice}
                    <ChessBoard fen={drillAnalysisResult.displayFEN}
                                invert={drillAnalysisResult.invert_board}
                                name="drill-board"
                                game_url={nextGame.url + "drillresult"}
                                draggable={!currentDrillResult}
                                arrows={currentDrillResult ? drillAnalysisResult.arrows.map(arrow => <Arrow {...arrow}></Arrow>) : []}
                                moveCallback={move => {
                                    console.log(drillAnalysisResult.arrows);
                                    console.log(move);

                                    let filtered =
                                        drillAnalysisResult
                                            .arrows
                                            .filter(arrow => arrow.color === "green")
                                            .filter(arrow => arrow.moveSan === move.san);

                                    if (filtered.length > 0) {
                                        console.log("Success, " + move.san + " was the right move.");
                                        setCurrentDrillResult("Success");
                                    } else {
                                        console.log("failure, was expecting another move")
                                        setCurrentDrillResult("Failure")
                                    }
                                }}
                    ></ChessBoard>
                </div>
                <div className="buttonlist">
                    <md-text-button onClick={() => window.open(drillAnalysisResult.headers.Link)}>Chess.com</md-text-button>
                    <md-text-button
                        onClick={() => window.open('https://lichess.org/analysis/' + drillAnalysisResult.displayFEN)}>Lichess
                        Analysis
                    </md-text-button>
                    <md-text-button
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
                <p>{"Oops, better study on this one."}
                </p>
                <p>
                    <md-filled-button onClick={() => {
                        setCurrentDrillIndex(currentDrillIndex + 1);
                        setCurrentDrillResult(undefined);
                    }}>Next
                    </md-filled-button>
                </p>
            </>

        } else if (currentDrillResult === "Success") {
            drillCurrentDisplay = <>
                <p>{"Congrats, you did it!"}</p>
                <md-filled-button onClick={() => {
                        setCurrentDrillIndex(currentDrillIndex + 1);
                        setCurrentDrillResult(undefined);

                    }}>Next

                    </md-filled-button>
            </>

        }
    }

    const drillPage =
        <>
            <h2>Drills</h2>
            <p>In this page, you can practice the moves you missed from your repertoire.</p>
            <p>They are presented here in chronological order starting with the most recent games.</p>

            {drillBoard}
            {drillCurrentDisplay}
        </>


    // set up tabs
    useEffect(() => {
        let currentPanel = document.querySelector('#panel-one');

        const tabs = document.querySelector("#nav-tabs");
        tabs.addEventListener('change', () => {
            if (currentPanel) {
                currentPanel.hidden = true;
            }

            const panelId = tabs.activeTab?.getAttribute('aria-controls');
            const root = tabs.getRootNode();
            currentPanel = root.querySelector(`#${panelId}`);
            if (currentPanel) {
                currentPanel.hidden = false;
            }
        });

    }, []);

    return (
        <>
            <h1>Book It</h1>
            <p>A tool to help you learn your chess opening lines</p>

            <md-tabs
                id="nav-tabs"
                aria-label="A custom themed tab bar"
                class="custom"
                activeTabIndex={activeTab}
                onChange={(e) => {
                    console.log("Change triggered", e)
                }}>
                <md-primary-tab id="tab-one" aria-controls="panel-one">
                    Configuration
                </md-primary-tab>
                <md-primary-tab id="tab-two" aria-controls="panel-two">
                    Results
                </md-primary-tab>
                <md-primary-tab id="tab-three" aria-controls="panel-three">
                    Drill
                </md-primary-tab>
            </md-tabs>

            <div role="tabpanel" id="panel-one" aria-labelledby="tab-one">
                {configPage}
            </div>
            <div role="tabpanel" id="panel-two" aria-labelledby="tab-two" hidden>
                {resultsPage}
            </div>
            <div role="tabpanel" id="panel-three" aria-labelledby="tab-three" hidden>
                {drillPage}
            </div>
        </>
    );
}

export default App;
