import AnalysisResult from "../components/AnalysisResult";
import {setItemGZIP} from "../storage";
import refreshGames from "../integrations/chess.com";


export default function Results({games, userLeftBookOnly, setUserLeftBookOnly, playerName, repertoireChoice, analysisDatabase, setGames}) {
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

    return <>
        <h2>Results</h2>
        <p>Reviewing lines from repertoire "{repertoireChoice}" as {playerName}</p>
        <p>This is a list of games at the position where they left the book.</p>
        <label>
            Show only lines where you left book first
            {leftBookCheckbox}
        </label>
        <br></br>
        <p><md-filled-button onClick={() => { refreshGames(games, setGames, playerName) }}>Refresh games</md-filled-button>
        </p>
        <p>Found {listItems.length} results.</p>
        <md-list>
            {listItems}
        </md-list>
    </>;
}