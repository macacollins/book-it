import { matchGameToGRB } from "../../analysis/matchGameToGRB";
import { GradualRepertoire, SavedGame } from "../../database";

export interface TimelineDay {
  name: string;
  results: SavedGame[];
}

export default function generateTimelineData(
  games: SavedGame[],
  repertoires: GradualRepertoire[],
): TimelineDay[] {
  console.log(
    "[" +
      games.map((game) => JSON.stringify(game, undefined, 2)).join(",") +
      "]",
  );
  let timelineDays: Record<string, TimelineDay> = {};

  for (let game of games) {
    let lastDay = new Date(game.timestamp).toLocaleDateString("en-US");

    // const result: GameResult = generateSingleResult(game, repertoires);

    if (timelineDays[lastDay]) {
      timelineDays[lastDay] = {
        ...timelineDays[lastDay],
        results: [...timelineDays[lastDay].results, game],
      };
    } else {
      timelineDays[lastDay] = {
        name: lastDay,
        results: [game],
      };
    }
  }

  const collectedDays: TimelineDay[] = [];

  Object.keys(timelineDays).map((timelineDayName) => {
    let contents = {
      name: timelineDayName,
      results: timelineDays[timelineDayName].results,
    };

    collectedDays.push(contents);
  });

  const sorted = collectedDays.sort((a: TimelineDay, b: TimelineDay) => {
    const aTime = new Date(a.name).getTime();
    const bTime = new Date(b.name).getTime();
    return bTime - aTime;
  });

  return sorted;
}
