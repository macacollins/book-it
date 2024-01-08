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
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/textfield/outlined-text-field.js';

import Arrow from './components/Arrow';
import Drawings from './components/Drawings';
import AnalysisResult from './components/AnalysisResult';
import FileUpload from './components/FileUpload';
import ChessBoard from './components/ChessBoard';
import calculateAnalysis from './analysis/calculateAnalysis';
import refreshGames from './integrations/chess.com'
import loadCachedData from './loadCachedData';

function App() {

    const [games, setGames] = useState([]);
    const [repertoire, setRepertoire] = useState([]);
    const [analysisDatabase, setAnalysisDatabase ] = useState({})

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

    let listItems = games && games.map && games.map(game => {
        return <AnalysisResult game={game} analysisDatabase={analysisDatabase}></AnalysisResult>
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

export default App;
