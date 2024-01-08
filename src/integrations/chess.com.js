

function refreshGames(setGames) {
    console.log("Fetching games from chess.com");
    // start request to chess.com for data
    fetch('https://api.chess.com/pub/player/***REMOVED***/games/2024/01')
        .then((res) => res.json())
        .then((data) => {
            //console.log(data);
            const games = data.games;

            games.reverse();
            setGames(games.slice(0, 10));
            localStorage.setItem('games', JSON.stringify(games));
        })
        .catch((err) => {
            console.log(err.message);
        });

}

export default refreshGames;