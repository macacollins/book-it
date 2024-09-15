import {getAllGames, addGamesBulk, getLatestLichessTimestamp} from '../storage';

import pgnParser from 'pgn-parser';

import getGameFromPGN from './getGameFromPGN';

async function refreshGames(setGames, playerName, setSyncingGames) {
    console.log("Fetching games from lichess.org");

    const lastTimestamp = await getLatestLichessTimestamp();
    console.log("Lichess got timestamp", lastTimestamp);

    let finalGames = [];

    const oneMonth = 1000 * 60 * 60 * 24 * 30;
    const oneMonthAgo = Date.now() - oneMonth;

    let numberMonths = 1;

    let monthByMonth = false;
    let targetSinceTimestamp;
    let targetUntilTimestamp = Date.now();

    if (isNaN(lastTimestamp) || lastTimestamp < oneMonthAgo) {
        numberMonths = Math.ceil(Date.now() - lastTimestamp / oneMonth)

        if (isNaN(lastTimestamp) || numberMonths > 24) {
            numberMonths = 24;
        }
        monthByMonth = true;
        console.log("Getting lichess data for the last " + numberMonths + " months.")
    } else {
        targetSinceTimestamp = lastTimestamp;
        console.log("Using lastTimestamp value")
    }

    for (let i = 0; i < numberMonths; i++) {
        if (monthByMonth) {
            targetSinceTimestamp = Date.now() - (oneMonth * (i + 1));
            targetUntilTimestamp = Date.now() - (oneMonth * i);
        }

        console.log("Fetching with timestamp of " + targetSinceTimestamp + " and end time of " + targetUntilTimestamp);

        // start requests to lichess.org for data
        // eslint-disable-next-line
        const result = await fetch(
            'https://lichess.org/api/games/user/' + playerName + 
            "?since=" + targetSinceTimestamp +
            "&until=" + targetUntilTimestamp
            )
            .then((res) => res.text())
            // We only care about the final value
            // Disabling the unsafe references check
            // eslint-disable-next-line
            .then(async (data) => {

                console.log("Got data", data)

                const games = pgnParser.parse(data);

                finalGames = games.map(game => getGameFromPGN(game, "lichess"));

                addGamesBulk(finalGames);
                setGames(await getAllGames())

            })
            .catch((err) => {
                console.log(err.message);
            });

        console.log("Result", result);
    }

    console.log("Got " + finalGames.length + " from lichess.")
    setSyncingGames(false);
    
    addGamesBulk(finalGames);

    setGames(await getAllGames())
}


export default refreshGames;