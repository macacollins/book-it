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

import ConfigPage from './pages/Configuration';
import Results from './pages/Results';
import Drills from './pages/Drills';

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
    const [activeTab, setActiveTab] = useState("panel-one");

    useEffect(() => {
            console.log("Calculating analysis")

            // put on the queue
            setTimeout(() => {
                calculateAnalysis(analysisDatabase, repertoire, games, setAnalysisDatabase, playerName);
            }, 0);
        }, [repertoire, games]
    )

    const resultsPage = <Results { ... {games, userLeftBookOnly, setUserLeftBookOnly, playerName, repertoireChoice, analysisDatabase, setGames} }></Results>;

    console.log("new repertoire name field is ", newRepertoireNameField);

    const configPage = <ConfigPage { ... {
        playerName, setPlayerName, repertoireChoice, setRepertoireChoice, newRepertoireNameField, setNewRepertoireNameField,
        setRepertoire, repertoire, repertoireList, setRepertoireList, matchingMoves, setMatchingMoves} }/>

    const drillPage = <Drills { ... { games, analysisDatabase } }></Drills>

    // set up tabs
    // TODO React state-ify it
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

            setActiveTab(panelId)
            if (currentPanel) {
                currentPanel.hidden = false;
            }
        });

    }, []);

    return (
        <>
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
                {activeTab === "panel-one" && configPage || ''}
            </div>
            <div role="tabpanel" id="panel-two" aria-labelledby="tab-two" hidden>
                {activeTab === "panel-two" && resultsPage || ""}
            </div>
            <div role="tabpanel" id="panel-three" aria-labelledby="tab-three" hidden>
                {activeTab === "panel-three" && drillPage || ""}
            </div>
        </>
    );
}

export default App;
