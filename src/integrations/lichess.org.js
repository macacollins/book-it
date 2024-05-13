import {getItemDexie, setItemDexie} from '../storage';

import pgnParser from 'pgn-parser';

import getGameFromPGN from './getGameFromPGN';

async function refreshGames(games, setGames, playerName, setSyncingGames) {
    console.log("Fetching games from lichess.org");

    // setGames([]);
    // setItemDexie('games', [])

    let finalGames = [];

    for (let i = 0; i < 1; i++) {

        // start requests to ichess.org for data
        await fetch('https://lichess.org/api/games/user/' + playerName)
            .then((res) => res.text())
            // We only care about the final value
            // Disabling the unsafe references check
            // eslint-disable-next-line
            .then(async (data) => {

                // response.body.

                console.log("Got data", data)

                const games = pgnParser.parse(data);

                finalGames = games.map(getGameFromPGN)

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

    console.log("Got " + finalGames.length + " from lichess.")
    setSyncingGames(false);

    let storageGames = await getItemDexie('games');

    if (finalGames.length === 0 && playerName === "example") {
        // For the example, we don't want to clear out the games if they press this
        return;
    }

    const lichessDotOrgGames = storageGames.filter(game => {
        return game.url.indexOf("lichess.org") !== -1;
    })

    const otherGames = storageGames.filter(game => {
        return game.url.indexOf("lichess.org") === -1;
    })

    if (lichessDotOrgGames.length !== finalGames.length) {

        let actualFinalGames = [ ...finalGames, ...otherGames ] 

        function customSort(item) {
            // For example, sorting based on the 'value' property
            return item.end_time;
        }

        actualFinalGames = actualFinalGames.sort(function (a, b) {
            return customSort(a) - customSort(b);
        }).reverse();

        setGames(actualFinalGames);
        setItemDexie('games', actualFinalGames);
    }
}


export default refreshGames;