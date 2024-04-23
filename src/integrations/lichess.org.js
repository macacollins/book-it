import {setItemDexie} from '../storage';

import pgnParser, { ParsedPGN } from 'pgn-parser';

import getGameFromPGN from './getGameFromPGN';


// Function to get the year and month X months back
function getYearAndMonthXMonthsAgo(X) {
    const currentDate = new Date();
    const targetDate = new Date(currentDate);

    let currentYear = targetDate.getFullYear();
    let currentMonth = targetDate.getMonth();

    for (let i = 0; i < X; i++) {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear = currentYear - 1;
        } else {
            currentMonth = currentMonth - 1;
        }
    }

    currentMonth += 1;

    const twoDigitMonth =
        currentMonth > 9 ? currentMonth : "0" + currentMonth;

    return {year: currentYear, month: twoDigitMonth};
}

async function refreshGames(games, setGames, playerName, setSyncingGames) {
    console.log("Fetching games from chess.com");

    // setGames([]);
    // setItemDexie('games', [])

    let finalGames = [];

    for (let i = 0; i < 1; i++) {

        // start requests to chess.com for data
        await fetch('https://lichess.org/api/games/user/' + playerName)
            .then((res) => res.text())
            // We only care about the final value
            // Disabling the unsafe references check
            // eslint-disable-next-line
            .then(async (data) => {

                console.log("Got data", data)

                const games = pgnParser.parse(data);

                finalGames = games.map(getGameFromPGN)

                const thisMonthGames = data.games || [];

                const newGames = thisMonthGames.reverse();

                // const fullGameList = [...new Set([...finalGames, ...newGames])];

                function customSort(item) {
                    // For example, sorting based on the 'value' property
                    return item.end_time;
                }

                finalGames = finalGames.sort(function (a, b) {
                    return customSort(a) - customSort(b);
                }).reverse();
            })
            .catch((err) => {
                console.log(err.message);
            });
    }
    setSyncingGames(false);

    if (finalGames.length === 0 && playerName === "example") {
        // For the example, we don't want to clear out the games if they press this
        return;
    }

    if (games.length !== finalGames.length) {
        setGames(finalGames);
        setItemDexie('games', finalGames);
    }
}


export default refreshGames;