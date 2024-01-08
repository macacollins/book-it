import refreshGames from './integrations/chess.com';

function loadCachedData(setAnalysisDatabase, setRepertoire, setGames) {

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
        refreshGames(setGames);
    }
}

export default loadCachedData;