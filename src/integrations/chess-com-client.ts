import Game from "../types/Game";

// Function to get the year and month X months back
function getYearAndMonthXMonthsAgo(X: number): { year: number; month: string } {
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
    currentMonth > 9 ? currentMonth.toString() : "0" + currentMonth;

  return { year: currentYear, month: twoDigitMonth };
}

/**
 * Fetches chess games from Chess.com for the specified player over the last 3 months
 * @param playerName The Chess.com username
 * @returns Promise that resolves to an array of games
 */
export async function fetchChessComGames(playerName: string): Promise<Game[]> {
  console.log("Fetching games from chess.com");

  let finalGames: Game[] = [];

  for (let i = 0; i < 3; i++) {
    const { year, month } = getYearAndMonthXMonthsAgo(i);

    try {
      const response = await fetch(
        `https://api.chess.com/pub/player/${playerName}/games/${year}/${month}`,
      );

      const data = await response.json();
      const thisMonthGames: Game[] = data.games || [];

      // Reverse to get newest first for this month
      const newGames = thisMonthGames.reverse();

      // Combine with existing games, removing duplicates
      const fullGameList = [...new Set([...finalGames, ...newGames])];

      // Sort by end_time in descending order (newest first)
      finalGames = fullGameList.sort((a, b) => b.end_time - a.end_time);
    } catch (err) {
      console.log(
        `Error fetching games for ${year}/${month}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(`Got ${finalGames.length} games from chess.com.`);

  return finalGames;
}

export default fetchChessComGames;
