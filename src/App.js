import './App.css';

import {useState, useEffect} from 'react';

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
import FileUpload from './components/FileUpload';
import calculateAnalysis from './analysis/calculateAnalysis';
import refreshGames from './integrations/chess.com'
import loadCachedData from './loadCachedData';


function App() {

    const [games, setGames] = useState([]);
    const [repertoire, setRepertoire] = useState([]);
    const [analysisDatabase, setAnalysisDatabase] = useState({});
    const [userLeftBookOnly, setUserLeftBookOnly] = useState(true);

    // tab navigation
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        loadCachedData(setAnalysisDatabase, setRepertoire, setGames)
    }, []);


    useEffect(() => {
            console.log("Calculating analysis")

            // put on the queue
            setTimeout(() => {
                setAnalysisDatabase(calculateAnalysis(analysisDatabase, repertoire, games));
            }, 0);
        }, [repertoire, games]
    )

    let listItems = games && games.filter &&
        games.filter(game => {
            if (userLeftBookOnly) {
                return analysisDatabase[game.url] && analysisDatabase[game.url].you_left_book
            }
            return true;
        }).map(game => {
            return <AnalysisResult game={game} analysisDatabase={analysisDatabase}></AnalysisResult>
        });

    const resultsPage = <>
        <h2>Results</h2>
        <p>This is a list of games at the position where they left the book.</p>
        <p>Found {listItems.length} results.</p>
        <md-list>
            {listItems}
        </md-list>
    </>;

    const configPage = <>
        <h2>Configuration</h2>

        <h3>Repertoire</h3>
        <div class="column" role="radiogroup" aria-label="Repertoire">
            <div class="radio-label">
                <md-radio
                    aria-label="Default lines"
                    id="default-lines-radio"
                    name="with-labels"
                    {... { "touch-target": "wrapper" } }>
                </md-radio>
                <label for="default-lines-radio">Default Lines</label>
            </div>
            <div class="radio-label">
                <md-radio
                    aria-label="Custom Lines"
                    id="custom-lines-radio"
                    name="with-labels"
                    {... { "touch-target": "wrapper" } }>
                </md-radio>
                <label for="custom-lines-radio">Custom Lines Already Uploaded</label>
            </div>
            <div class="radio-label">
                <md-radio
                    aria-label="Upload New Lines"
                    id="dogs-radio"
                    name="with-labels"
                    {... { "touch-target": "wrapper" } }>
                </md-radio>
                <label for="dogs-radio">Upload New Lines</label>
            </div>
        </div>
        {'Upload your lines here as a file'}
        <FileUpload setRepertoire={setRepertoire}> </FileUpload>

        <label>
            Show only lines where you left book first
            <md-checkbox
                checked={userLeftBookOnly}
                onClick={() => {
                    setUserLeftBookOnly(!userLeftBookOnly)
                }}>
            </md-checkbox>
        </label>

        <br></br>

        <md-filled-button onClick={() => refreshGames(setGames)}>Refresh games</md-filled-button>
    </>

    const drillPage = <>This functionality is still in active development.</>


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
                onChange={(e) => { console.log("Change triggered", e)}}>
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
