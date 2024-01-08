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

import AnalysisResult from './components/AnalysisResult';
import FileUpload from './components/FileUpload';
import calculateAnalysis from './analysis/calculateAnalysis';
import refreshGames from './integrations/chess.com'
import loadCachedData from './loadCachedData';

function App() {

    const [games, setGames] = useState([]);
    const [repertoire, setRepertoire] = useState([]);
    const [analysisDatabase, setAnalysisDatabase ] = useState({});
    const [userLeftBookOnly, setUserLeftBookOnly ] = useState(true);

    useEffect(() => { loadCachedData(setAnalysisDatabase, setRepertoire, setGames) }, []);


    useEffect(() => {
        console.log("Calculating analysis")

        // put on the queue
        setTimeout(() => {
            setAnalysisDatabase(calculateAnalysis(analysisDatabase, repertoire, games));
        }, 0)

        }, // end useEffect
        [repertoire, games]
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

    return (
        <>
            <h1>Book It</h1>
            <p>A tool to help you learn your chess opening lines</p>

            <h2>Configuration</h2>
            {'Enter your lines here as a file'}
            <FileUpload setRepertoire={setRepertoire}> </FileUpload>

            <label>
                Show only lines where you left book first
                <md-checkbox
                    checked={userLeftBookOnly}
                    onClick={() => { setUserLeftBookOnly(!userLeftBookOnly)}}>
                </md-checkbox>
            </label>

            <br></br>

            <md-filled-button onClick={() => refreshGames(setGames)}>Refresh games</md-filled-button>

            <h2>Results</h2>
            <p>This is a list of games at the position where they left the book.</p>
            <p>Found {listItems.length} results.</p>
            <md-list>
                {listItems}
            </md-list>

        </>
    );
}

export default App;
