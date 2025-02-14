import AnalysisResult from "../components/AnalysisResult";
import { setItemDexie } from "../storage";
// import refreshGames from "../integrations/chess.com";
import refreshGamesLichess from "../integrations/lichess.org";
import refreshGamesChessCom from "../integrations/chess.com";

import { Dispatch, SetStateAction, useState } from "react";
import findTopOpenings from "../analysis/findTopOpenings";
import AnalysisDatabase from "../types/AnalysisDatabase";
import Game from "../types/Game";
import { Button } from 'primereact/button';
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { ProgressSpinner } from "primereact/progressspinner";

interface ResultsProps {
  games: Game[];
  userLeftBookOnly: boolean;
  setUserLeftBookOnly: Dispatch<SetStateAction<boolean>>;
  playerName: string;
  playerNameLichess: string;
  repertoireChoice: string;
  analysisDatabase: AnalysisDatabase;
  setGames: (newValue: Game[]) => void;
}

export default function Results({
  games,
  userLeftBookOnly,
  setUserLeftBookOnly,
  playerName,
  repertoireChoice,
  playerNameLichess,
  analysisDatabase,
  setGames,
}: ResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const [syncingGames, setSyncingGames] = useState(false);
  const [syncingGamesLichess, setSyncingGamesLichess] = useState(false);

  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const [currentOpeningFilter, setCurrentOpeningFilter] = useState("");

  let filteredGames =
    games && games.filter
      ? games.filter((game) => {
          if (currentOpeningFilter === "") {
            if (userLeftBookOnly) {
              return (
                analysisDatabase[game.url] &&
                analysisDatabase[game.url].youLeftBook
              );
            }
            return true;
          } else if (
            analysisDatabase[game.url] &&
            currentOpeningFilter === analysisDatabase[game.url].openingFamily
          ) {
            if (userLeftBookOnly) {
              return (
                analysisDatabase[game.url] &&
                analysisDatabase[game.url].youLeftBook
              );
            }
            return true;
          } else {
            return false;
          }
        })
      : [];

  // listItems = listItems;
  let sliced = filteredGames.slice(
    indexOfFirstItem,
    indexOfFirstItem + itemsPerPage,
  );

  let listItems = sliced.map((singleGame, index) => {
    return (
      <AnalysisResult
        game={singleGame}
        index={index}
        analysisDatabase={analysisDatabase}
        nameOverride=""
      ></AnalysisResult>
    );
  });

  const filteredGamesLength = filteredGames.length;

  const topOpeningsFilteredList =
    games && games.filter
      ? games.filter((game) => {
          if (userLeftBookOnly) {
            return (
              analysisDatabase[game.url] &&
              analysisDatabase[game.url].youLeftBook
            );
          }
          return true;
        })
      : [];

  let topOpenings = findTopOpenings(
    topOpeningsFilteredList,
    analysisDatabase,
  ).slice(0, 14);

  const openingFiltersFull = (
    <>
      <h3>Opening Filter</h3>
      <Dropdown
        value={currentOpeningFilter}
        options={topOpenings.map(({opening,count}) => ({
          label: opening + " " + count,
          value: opening
        }))}
        onChange={(e) => {
          setCurrentOpeningFilter(e.value);
        }}
        placeholder="Select an Opening"
      />
    </>
  );

  let numberPages = Math.ceil(filteredGamesLength / itemsPerPage);

  const leftBookCheckbox = userLeftBookOnly ? (
    <Checkbox
      data-testid="leftBookCheckbox"
      checked={userLeftBookOnly}
      className="mr-2"
      onClick={() => {
        setCurrentPage(1);
        setUserLeftBookOnly(!userLeftBookOnly);
        setItemDexie("userLeftBookOnly", !userLeftBookOnly);
      }}
    ></Checkbox>
  ) : (
    <Checkbox
      checked={userLeftBookOnly}
      data-testid="leftBookCheckbox"
      className="mr-2"

      onClick={() => {
        setCurrentPage(1);
        setUserLeftBookOnly(!userLeftBookOnly);
        setItemDexie("userLeftBookOnly", !userLeftBookOnly);
      }}
    ></Checkbox>
  );

  let indicesToUse = Array.from({ length: numberPages }).map(
    (ignore, index) => index,
  );

  if (currentPage > 5) {
    indicesToUse = indicesToUse.map((number) => number + currentPage - 5);
  }

  if (currentPage < numberPages - 5) {
    indicesToUse = indicesToUse.slice(0, 10);
  }

  const paginationButtons = indicesToUse.map((item, index) => {
    const className = item === currentPage - 1 ? "currentPage" : "";

    return item < numberPages ? (
      <Button
        data-testid={`page-${item + 1}-button`}
        key={item}
        onClick={() => setCurrentPage(item + 1)}
        {...{ class: className }}
      >
        {item + 1}
      </Button>
    ) : (
      ""
    );
  });

  // Show buttons for first and last pages
  if (currentPage > 5) {
    paginationButtons.unshift(
      <Button
        data-testid={"first-page-button"}
        key="first"
        onClick={() => setCurrentPage(1)}
      >
        First
      </Button>,
    );
  }

  if (currentPage < numberPages - 9) {
    paginationButtons.push(
      <Button
        data-testid={"last-page-button"}
        key="last"
        onClick={() => setCurrentPage(numberPages)}
      >
        Last
      </Button>,
    );
  }

  const [ first, setFirst ] = useState(0);
  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setCurrentPage(event.page + 1);
    setFirst(event.first);
};

  const paginationSection = (
      <Paginator 
      first={first} 
      rows={10} 
      totalRecords={filteredGamesLength} 
      onPageChange={onPageChange} />
  );

  const syncingIndicator = syncingGames ? (
    <ProgressSpinner></ProgressSpinner>
  ) : (
    ""
  );
  const syncingIndicator2 = syncingGamesLichess ? (
    <ProgressSpinner></ProgressSpinner>
  ) : (
    ""
  );

  return (
    <>
      <h2>Games</h2>
      <p>This is a list of games at the position where they left the book.</p>
      <p>
        <label>
          {leftBookCheckbox}
          Show only lines where you left book first
        </label>
      </p>
      <br></br>
      {openingFiltersFull}
      <br></br>
      <p>
        <Button
          data-testid="refreshGamesButton"
          onClick={() => {
            setSyncingGames(true);
            setSyncingGamesLichess(true);
            refreshGamesChessCom(setGames, playerName, setSyncingGames);
            refreshGamesLichess(
              setGames,
              playerNameLichess,
              setSyncingGamesLichess,
            );
          }}
        >
          Refresh games
        </Button>
        {syncingIndicator}
        {syncingIndicator2}
      </p>
      <p>{`Found ${filteredGamesLength} results.`}</p>
      {paginationSection}
      <ul>{listItems}</ul>
      {paginationSection}
    </>
  );
}
