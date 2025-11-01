import {
  getAllGames,
  addGamesBulk,
  getLatestLichessTimestamp,
} from "../storage";

import pgnParser from "pgn-parser";

import getGameFromPGN from "./getGameFromPGN";
import makeStreamingRequest from "./makeStreamingRequest";

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
    numberMonths = Math.ceil(Date.now() - lastTimestamp / oneMonth);

    if (isNaN(lastTimestamp) || numberMonths > 24) {
      numberMonths = 24;
    }
    monthByMonth = true;
    console.log(
      "Getting lichess data for the last " + numberMonths + " months.",
    );
  } else {
    targetSinceTimestamp = lastTimestamp;
    console.log("Using lastTimestamp value");
  }

  targetSinceTimestamp = Date.now() - oneMonth * 24;
  targetUntilTimestamp = Date.now() - oneMonth * 0;

  const finalURL =
    "https://lichess.org/api/games/user/" +
    playerName +
    "?clocks=true&since=" +
    targetSinceTimestamp +
    "&until=" +
    targetUntilTimestamp;

  let batchSize = 15;

  let current = 0;

  makeStreamingRequest(
    finalURL,
    (game) => {
      const pgn = pgnParser.parse(game);

      const chessGame = getGameFromPGN(pgn[0], "lichess");
      finalGames.push(chessGame); // TODO consider

      current++;

      if (current % batchSize === 0) {
        addGamesBulk(finalGames);
        setTimeout(async () => setGames(await getAllGames()), 0);
        console.log("Got message", game);
      }
    },
    () => {
      console.log("Finished");
    },
  );
  /*
    // start requests to lichess.org for data
    // eslint-disable-next-line
    const result = await fetch(
      
    )
      .then((res) => res.text())
      // We only care about the final value
      // Disabling the unsafe references check
      // eslint-disable-next-line
      .then(async (data) => {
        console.log("Got data", data);

        const games = pgnParser.parse(data);

        finalGames = games.map((game) => getGameFromPGN(game, "lichess"));

        addGamesBulk(finalGames);
        setGames(await getAllGames());
      })
      .catch((err) => {
        console.log(err.message);
      });
*/
  //console.log("Result", result);

  console.log("Got " + finalGames.length + " from lichess.");
  setSyncingGames(false);

  addGamesBulk(finalGames);

  setGames(await getAllGames());
}

export default refreshGames;

export async function getLichessAnalysis(fen) {
  let params =
    "variant=standard" +
    `&fen=${fen}` +
    "&speeds=blitz" +
    "&ratings=1800%2C2000%2C2200" +
    "&source=analysis";

  let finalURL = "https://explorer.lichess.ovh/lichess?" + params;

  return fetch(finalURL);
}

export async function getLichessMastersAnalysis(fen) {
  let params =
    "variant=standard" +
    `&fen=${fen}` +
    "&speeds=blitz" +
    "&ratings=1800%2C2000%2C2200" +
    "&source=analysis";

  let finalURL = "https://explorer.lichess.ovh/masters?" + params;

  return fetch(finalURL);
}
