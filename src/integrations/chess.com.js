
import { getItemDexie, setItemDexie } from '../storage';

// Function to get the current year and month
function getCurrentYearAndMonth() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // Months are zero-based, so we add 1
    return { year, month };
}

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

    return { year : currentYear, month: twoDigitMonth };
}

async function refreshGames(games, setGames, playerName) {
    console.log("Fetching games from chess.com");

    // setGames([]);
    // setItemDexie('games', [])

    let finalGames = [];

    for (let i = 0; i < 3; i++) {
        let {year, month} = getYearAndMonthXMonthsAgo(i);

        // start requests to chess.com for data
        await fetch('https://api.chess.com/pub/player/' + playerName + "/games/" + year + "/" + month)
            .then((res) => res.json())
            .then(async (data) => {
                const thisMonthGames = data.games || [];

                const newGames = thisMonthGames.reverse();

                const fullGameList = [ ... new Set([ ...finalGames, ...newGames ]) ];

                function customSort(item) {
                    // For example, sorting based on the 'value' property
                    return item.end_time;
                }

                // Sort the array based on the result of the custom function
                finalGames = fullGameList.sort(function(a, b) {
                    return customSort(a) - customSort(b);
                }).reverse();
            })
            .catch((err) => {
                console.log(err.message);
            });
    }

    if (games.length !== finalGames.length) {
        setGames(finalGames);
        setItemDexie('games', finalGames);
    }
}



export default refreshGames;