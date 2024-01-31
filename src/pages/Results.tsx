import AnalysisResult from "../components/AnalysisResult";
import {setItemDexie} from "../storage";
import refreshGames from "../integrations/chess.com";

import {Dispatch, SetStateAction, useState} from 'react';
import findTopOpenings from "../analysis/findTopOpenings";
import AnalysisDatabase from "../types/AnalysisDatabase";
import Game from "../types/Game";


interface ResultsProps {
    games: Game[],
    userLeftBookOnly: boolean,
    setUserLeftBookOnly: Dispatch<SetStateAction<boolean>>,
    playerName: string,
    repertoireChoice: string,
    analysisDatabase: AnalysisDatabase,
    setGames: (newValue: Game[]) => void
}

export default function Results({
                                    games,
                                    userLeftBookOnly,
                                    setUserLeftBookOnly,
                                    playerName,
                                    repertoireChoice,
                                    analysisDatabase,
                                    setGames
                                }: ResultsProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const [syncingGames, setSyncingGames] = useState(false);

    const itemsPerPage = 10;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const [currentOpeningFilter, setCurrentOpeningFilter] = useState("");

    let filteredGames = games && games.filter ?
        games.filter(game => {
            if (currentOpeningFilter === "") {
                if (userLeftBookOnly) {
                    return analysisDatabase[game.url] && analysisDatabase[game.url].youLeftBook
                }
                return true;
            } else if (analysisDatabase[game.url] && currentOpeningFilter === analysisDatabase[game.url].openingFamily) {
                if (userLeftBookOnly) {
                    return analysisDatabase[game.url] && analysisDatabase[game.url].youLeftBook
                }
                return true;
            } else {
                return false
            }
        }) : [];

    // listItems = listItems;
    let sliced = filteredGames.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);

    let listItems = sliced.map((singleGame, index) => {

        return <AnalysisResult game={singleGame} index={index} analysisDatabase={analysisDatabase} nameOverride=""></AnalysisResult>
    });

    const filteredGamesLength = filteredGames.length;

    const topOpeningsFilteredList = games && games.filter ?
        games.filter(game => {
            if (userLeftBookOnly) {
                return analysisDatabase[game.url] && analysisDatabase[game.url].youLeftBook
            }
            return true;
        }) : [];

    let topOpenings = findTopOpenings(topOpeningsFilteredList, analysisDatabase).slice(0, 14);

    let openingFilters = topOpenings.map(({opening, count}) =>
        <md-select-option data-testid={`opening-${opening}`}
                          key={opening}
                          value={opening}
                          onClick={() => {
                              setCurrentOpeningFilter(opening)
                          }}>
            {opening} {count}
        </md-select-option>
    );

    openingFilters.push(
        <md-select-option data-testid={`clear-opening-filter`} key="clear" value={''} onClick={() => {
            setCurrentOpeningFilter('')
        }}>
            Clear Opening Filter
        </md-select-option>)

    const openingFiltersFull = <><h3>Opening Filter</h3>
        <md-outlined-select>
            {openingFilters}
        </md-outlined-select>
    </>

    let numberPages = Math.ceil(filteredGamesLength / itemsPerPage)

    const leftBookCheckbox = userLeftBookOnly ?
        <md-checkbox
            data-testid="leftBookCheckbox"
            checked={userLeftBookOnly}
            onClick={() => {
                setCurrentPage(1);
                setUserLeftBookOnly(!userLeftBookOnly)
                setItemDexie("userLeftBookOnly", !userLeftBookOnly);
            }}>
        </md-checkbox>
        :
        <md-checkbox
            data-testid="leftBookCheckbox"
            onClick={() => {
                setCurrentPage(1);
                setUserLeftBookOnly(!userLeftBookOnly)
                setItemDexie("userLeftBookOnly", !userLeftBookOnly);
            }}>
        </md-checkbox>

    let indicesToUse = Array.from({length: numberPages}).map((ignore, index) => index);

    if (currentPage > 5) {
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
                    <text-button data-testid={`page-${item + 1}-button`} key={item}
                                 onClick={() => setCurrentPage(item + 1)}  {...{"class": className}}>
                        {item + 1}
                    </text-button>
                    : ''
            }
        )

    // Show buttons for first and last pages
    if (currentPage > 5) {
        paginationButtons.unshift(
            <text-button data-testid={"first-page-button"} key="first" onClick={() => setCurrentPage(1)}>
                First
            </text-button>
        );
    }

    if (currentPage < numberPages - 9) {
        paginationButtons.push(
            <text-button data-testid={"last-page-button"} key="last" onClick={() => setCurrentPage(numberPages)}>
                Last
            </text-button>
        );
    }
    const paginationSection = <div className={"pagination"}><div className={"page"}>{"Page | "}</div>{paginationButtons}</div>

    const syncingIndicator = syncingGames ? <md-circular-progress indeterminate></md-circular-progress> : '';

    return <>
        <h2>Games</h2>
        <p>This is a list of games at the position where they left the book.</p>
        <p>
            <label>
                Show only lines where you left book first
                {leftBookCheckbox}
            </label>
        </p>
        <br></br>
        {openingFiltersFull}
        <br></br>
        <p>
            <md-filled-button data-testid="refreshGamesButton"
                              onClick={() => {
                                  setSyncingGames(true);
                                  refreshGames(games, setGames, playerName, setSyncingGames)
                              }}>Refresh games
            </md-filled-button>
            {syncingIndicator}
        </p>
        <p>{`Found ${filteredGamesLength} results.`}</p>
        {paginationSection}
        <md-list>
            {listItems}
        </md-list>
        {paginationSection}
    </>;
}