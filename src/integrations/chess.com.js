import {setItemDexie} from '../storage';

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

    for (let i = 0; i < 3; i++) {
        let {year, month} = getYearAndMonthXMonthsAgo(i);

        // start requests to chess.com for data
        await fetch('https://api.chess.com/pub/player/' + playerName + "/games/" + year + "/" + month)
            .then((res) => res.json())
            // We only care about the final value
            // Disabling the unsafe references check
            // eslint-disable-next-line
            .then(async (data) => {
                const thisMonthGames = data.games || [];

                const newGames = thisMonthGames.reverse();

                const fullGameList = [...new Set([...finalGames, ...newGames])];

                function customSort(item) {
                    // For example, sorting based on the 'value' property
                    return item.end_time;
                }

                finalGames = fullGameList.sort(function (a, b) {
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