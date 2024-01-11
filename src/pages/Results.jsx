import AnalysisResult from "../components/AnalysisResult";
import {setItemGZIP} from "../storage";
import refreshGames from "../integrations/chess.com";

import {useState} from 'react';


export default function Results({games, userLeftBookOnly, setUserLeftBookOnly, playerName, repertoireChoice, analysisDatabase, setGames}) {
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

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

    const filteredGamesLength = listItems.length

    listItems = listItems.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);

    let numberPages = Math.ceil(filteredGamesLength / itemsPerPage)

    const leftBookCheckbox = userLeftBookOnly ?
        <md-checkbox
            checked={userLeftBookOnly}
            onClick={() => {
                setCurrentPage(1);
                setUserLeftBookOnly(!userLeftBookOnly)
                setItemGZIP("userLeftBookOnly", !userLeftBookOnly);
            }}>
        </md-checkbox>
        :
        <md-checkbox
            onClick={() => {
                setCurrentPage(1);
                setUserLeftBookOnly(!userLeftBookOnly)
                setItemGZIP("userLeftBookOnly", !userLeftBookOnly);
            }}>
        </md-checkbox>

    let indicesToUse = Array.from({length: numberPages}).map((ignore, index) => index);

    if (currentPage > 5 ) {
        indicesToUse = indicesToUse.map(number => number + currentPage - 5);
    }

    if (currentPage < numberPages - 5) {
        indicesToUse = indicesToUse.slice(0, 10);
    }

    const paginationButtons =
        indicesToUse.map(
            (item, index) => {

                const className = item === currentPage - 1 ? "currentPage" : '';

                return item < numberPages ?
                    <text-button key={item} onClick={() => setCurrentPage(item + 1)}  { ... { "class": className } }>
                        {item + 1}
                    </text-button>
                    : ''
            }
        )

    // Show buttons for first and last pages
    if (currentPage > 5) {
        paginationButtons.unshift(
            <text-button key="first" onClick={() => setCurrentPage(1)}>
                First
            </text-button>
        );
    }

    if (currentPage < numberPages - 9) {
        paginationButtons.push(
            <text-button key="last" onClick={() => setCurrentPage(numberPages)}>
                Last
            </text-button>
        );
    }
    const paginationSection = <div className={"pagination"}> { "Page | " }{ paginationButtons }</div>

    return <>
        <h2>Results</h2>
        <p>Reviewing lines from repertoire "{repertoireChoice}" as {playerName}</p>
        <p>This is a list of games at the position where they left the book.</p>
        <label>
            Show only lines where you left book first
            {leftBookCheckbox}
        </label>
        <br></br>
        <p>
            <md-filled-button onClick={() => {
                refreshGames(games, setGames, playerName)
            }}>Refresh games
            </md-filled-button>
        </p>
        <p>Found {filteredGamesLength} results.</p>
        {paginationSection}
        <md-list>
            {listItems}
        </md-list>
        {paginationSection}
    </>;
}