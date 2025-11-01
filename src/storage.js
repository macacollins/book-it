import Dexie from "dexie";

const gamesDB = new Dexie("Games");

gamesDB.version(1).stores({
  games: "&url",
  analysis: "&url",
  comments: "&compositekey",
  book_lines: "++id,repertoireName,chapterName,lineName",
});

export async function saveBookGame(game, repertoireName) {
  if (!game) {
    return;
  }

  let chapterName, lineName;
  if (game.headers) {
    game.headers.forEach((header) => {
      if (header.name === "White") {
        chapterName = header.value;
      }

      if (header.name === "Black") {
        lineName = header.value;
      }
    });
  } else {
    chapterName = "Chapter 1";
    lineName = "Line";
  }

  gamesDB.book_lines.put({
    repertoireName,
    chapterName,
    lineName,
    game,
  });
}

export async function getBookGames(repertoireName) {
  if (!repertoireName) {
    return [];
  }
  const result = await gamesDB.book_lines
    .where("repertoireName")
    .equals(repertoireName)
    .toArray();

  return result;
}

export async function setComments(position, repertoire, comments) {
  if (!comments || !comments.length) {
    return;
  }

  gamesDB.comments.put({
    compositekey: repertoire + position,
    comments,
  });
}

export async function getComments(position, repertoire) {
  const result = await gamesDB.comments
    .where("compositekey")
    .equals(repertoire + position)
    .toArray();

  return result;
}

export async function getLatestLichessTimestamp() {
  const items = await gamesDB.games
    .filter((game) => /lichess/i.test(game.origin))
    .sortBy("end_time");
  return items && (items.reverse()[0]?.end_time + 1000) * 1000;
}

export async function clearAllGames() {
  await gamesDB.games.clear();
}

export async function addGamesBulk(games) {
  await gamesDB.games.bulkPut(games);
}

export async function addGame(game) {
  await gamesDB.games.add(game).then(function (updated) {
    if (updated) {
      console.log("New record inserted for " + game.url);
    } else {
      console.log(
        "Nothing was updated - there were no item with primary key: " +
          game.url,
      );
    }
  });
}

export async function addAnalysisBulk(analysisList) {
  await gamesDB.analysis.bulkPut(analysisList);
}

export async function addAnalysis(analysis) {
  await gamesDB.analysis.put(analysis).then(function (updated) {
    if (updated) {
      console.log("New analysis inserted for " + analysis.url);
    } else {
      console.log(
        "Nothing was updated - there were no item with primary key: " +
          analysis.url,
      );
    }
  });
}

export async function getAllGames() {
  const games = await gamesDB.games.filter((game) => true).sortBy("end_time");
  return games && games.reverse();
}
export async function getGameByID(id) {
  const filterURL = "https://lichess.org/" + id;

  return await gamesDB.games.get(filterURL);
}

/*
This application currently uses Dexie as a key-value store.
*/
const db = new Dexie("AppDatabase");

// Declare tables, IDs and indexes
db.version(1).stores({
  objectCache: "++id, key, value",
});

export async function getItemDexie(key) {
  const result = await db.objectCache.where("key").equals(key).toArray();

  if (result && result.length > 0) {
    if (result[0]) {
      // console.log("Got db result", result, result[0].value)
      return JSON.parse(result[0].value);
    }

    return [];
  } else {
    return [];
  }
}

export async function setItemDexie(key, value) {
  let currentValue = await db.objectCache.where("key").equals(key).toArray();

  if (currentValue.length === 0) {
    await db.objectCache
      .add({ key, value: JSON.stringify(value) })
      .then(function (updated) {
        if (updated) {
          console.log("New record inserted for " + key);
        } else {
          console.log(
            "Nothing was updated - there were no item with primary key: " +
              currentValue.id,
          );
        }
      });
  } else {
    await db.objectCache
      .update(currentValue[0].id, { key, value: JSON.stringify(value) })
      .then(function (updated) {
        if (updated) {
          console.log("Key updated");
        } else {
          console.log(
            "Nothing was updated - there were no item with primary key: " +
              currentValue.id,
          );
        }
      });
  }
}
