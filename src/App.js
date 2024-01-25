import './App.css';

import {useState, useEffect, useReducer} from 'react';
import {setItemDexie} from './storage';

import defaultGames from './integrations/default-games'

import analysisDatabaseReducer from './reducers/analysisDatabase';
import analyzeGames from './analysis/analyzeGames';

import './css/colors.module.css';
import './css/theme.css';
import './css/theme.dark.css';
import './css/theme.light.css';
import './css/tokens.css';
import './css/typography.module.css';

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
import '@material/web/select/select-option.js';
import '@material/web/select/outlined-select.js';

import defaultLines from './integrations/default-lines';

import ConfigPage from './pages/Configuration';
import Results from './pages/Results';
import Drills from './pages/Drills';
import processNewRepertoire from './integrations/processNewRepertoire';
function App({
                 analysisDatabaseStorage,
                 repertoireStorage,
                 gamesStorage,
                 playerNameStorage,
                 repertoireListStorage,
                 matchingMovesStorage,
                 userLeftBookOnlyStorage,
                 repertoireChoiceStorage,
                 worker,
                 activeTabStorage
             }) {

    console.log("App render")

    // Declare main state of application
    // This includes data stored by the application such as the repertoire and player name
    // This application may be a better fit for useReducer due to all the state that we are passing around.
    // The useState effect makes code very explicit about state stuff which is good
    const [playerName, setPlayerName] = useState(playerNameStorage || "")

    const [repertoire, setRepertoire] = useState(repertoireStorage || {});
    const [repertoireChoice, setRepertoireChoice] = useState(repertoireChoiceStorage);
    const [repertoireList, setRepertoireList] = useState(repertoireListStorage || []);

    const [games, setGames] = useState(gamesStorage || []);

    const [newRepertoireNameField, setNewRepertoireNameField] = useState("");
    const [userLeftBookOnly, setUserLeftBookOnly] = useState(userLeftBookOnlyStorage || true);
    const [matchingMoves, setMatchingMoves] = useState(matchingMovesStorage || 3)

    // tab navigation
    const [activeTab, setActiveTab] = useState((typeof activeTabStorage === "string" && activeTabStorage) || "panel-one");


    // This effect initializes a new repertoire based on some common Queen's Gambit lines if none are found
    useEffect(() => {
        (async () => {
            if (repertoireList.length === 0) {
                setPlayerName('example');
                await setItemDexie("playerName", "example")
                const defaultAnalysisName = "Queen's Gambit"
                await setItemDexie("repertoireChoice", defaultAnalysisName)
                processNewRepertoire(defaultLines, {
                    repertoire,
                    setRepertoire,
                    newRepertoireNameField: defaultAnalysisName,
                    setNewRepertoireNameField,
                    repertoireList,
                    setRepertoireList
                });
                setRepertoireChoice(defaultAnalysisName);

                setGames(defaultGames);
                await setItemDexie("games", defaultGames)

                await setItemDexie("repertoireChoice", defaultAnalysisName)

            }
        })()
    });

    const [analysisDatabase, dispatchAnalysisDatabase] = useReducer(analysisDatabaseReducer, analysisDatabaseStorage);

    // If the repertoire or games change, start performing analysis on the games
    useEffect(() => {
            if (!repertoireChoice) {
                // Nothing to do here
                return;
            }

            console.log("Calculating analysis for repertoire", repertoireChoice);

            let currentRepertoire = repertoire[repertoireChoice];

            function customSort(item) {
                // For example, sorting based on the 'value' property
                return item.end_time;
            }

            // Sort the array based on the result of the custom function
            const sortedGames = games.sort(function (a, b) {
                return customSort(a) - customSort(b);
            }).reverse();

            let payload = {analysisDatabase: analysisDatabase || {}, repertoire: currentRepertoire || {}, games: sortedGames || [], playerName};
            // console.log("Sending ", payload);
            if (worker) {
                worker.postMessage(payload);
                worker.onmessage = (message) => {
                    // console.log("answer from worker", message);

                    dispatchAnalysisDatabase({
                        type: 'ADD_ANALYSIS',
                        data: message.data.currentAnalysisDatabase
                    })
                };
            } else {
                // This section mostly included for unit testing
                console.log("Worker was not available. Starting synchronous analysis");
                // Do it synchronously

                function reportBack(currentAnalysisDatabase) {
                    // console.log("answer from worker", message);

                    dispatchAnalysisDatabase({
                        type: 'ADD_ANALYSIS',
                        data: currentAnalysisDatabase
                    })
                }

                analyzeGames({data: payload}, reportBack, reportBack)

            }
        },
        // These effect array items chosen on purpose
        // eslint-disable-next-line
        [repertoire, games]
    )

    // Create the actual pages
    const resultsPage = () => {
        // console.log("Results page function called");
        return <Results {...{
            games,
            userLeftBookOnly,
            setUserLeftBookOnly,
            playerName,
            repertoireChoice,
            analysisDatabase,
            setGames
        }}></Results>;
    }

    const configPage = () => <ConfigPage {...{
        playerName,
        setPlayerName,
        repertoireChoice,
        setRepertoireChoice,
        newRepertoireNameField,
        setNewRepertoireNameField,
        setRepertoire,
        repertoire,
        repertoireList,
        setRepertoireList,
        matchingMoves,
        setMatchingMoves,
        dispatchAnalysisDatabase,
        setGames,
        games,
        analysisDatabase
    }}/>

    const drillPage = () => <Drills {...{games, analysisDatabase}}></Drills>

    // set up tab change listener
    useEffect(() => {

        const tabs = document.querySelector("#nav-tabs");
        tabs.addEventListener('change', () => {
            const panelId = tabs.activeTab?.getAttribute('aria-controls');
            setActiveTab(panelId);
            setItemDexie("activeTab", panelId);
        });

    }, []);

    // hide the inactive tab panels
    const [oneProps, twoProps, threeProps] =
        ["panel-one", "panel-two", "panel-three"].map(
            tabID => tabID === activeTab ? {} : {"hidden": true}
        )

    // Add the active property to the appropriate md-primary-tab
    const [oneActive, twoActive, threeActive] =
        ["panel-one", "panel-two", "panel-three"].map(
            tabID => tabID === activeTab ? {"active": true} : {}
        )

    const [ colorScheme, setColorScheme ] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    useEffect(() => {

        if (colorScheme === 'dark') {
            document.querySelector('body').className = "dark-mode";
        }

        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addListener(event => {
            console.log("Got scheme listener to fire", event);
            const newColorScheme = event.matches ? "dark" : "light";

            setColorScheme(newColorScheme);

            if (newColorScheme === 'dark') {
                document.querySelector('body').className = "dark-mode";
            } else {
                document.querySelector('body').className = "";
            }
        });
    }, [colorScheme])

    let classProps = colorScheme === 'dark' ? { "class": "dark-mode"} : {};

    return (
        <mio-root {...classProps}>
            <md-tabs
                data-testid={"nav-tabs"}
                id="nav-tabs"
                aria-label="A custom themed tab bar">
                <md-primary-tab data-testid="configuration-tab" id="tab-one" aria-controls="panel-one" {...oneActive}>
                    Configuration
                </md-primary-tab>
                <md-primary-tab data-testid="games-tab" id="tab-two" aria-controls="panel-two" {...twoActive}>
                    Games
                </md-primary-tab>
                <md-primary-tab data-testid="drills-tab" id="tab-three" aria-controls="panel-three" {...threeActive}>
                    Drill
                </md-primary-tab>
            </md-tabs>

            <div role="tabpanel" id="panel-one" aria-labelledby="tab-one" {...oneProps}>
                {activeTab === "panel-one" ? configPage() : ''}
            </div>
            <div role="tabpanel" id="panel-two" aria-labelledby="tab-two" {...twoProps}>
                {activeTab === "panel-two" ? resultsPage() : ""}
            </div>
            <div role="tabpanel" id="panel-three" aria-labelledby="tab-three" {...threeProps}>
                {activeTab === "panel-three" ? drillPage() : ""}
            </div>
        </mio-root>
    );
}

export default App;
