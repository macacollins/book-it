function saveCache(fen, lichessResults) {
    localStorage.setItem(fen, JSON.stringify(lichessResults));
}

function retrieveCache(fen) {
    const item = localStorage.getItem(fen);

    if (item) {
        return JSON.parse(item);
    } else {
        return undefined;
    }
}

async function getLichessAnalysis(fen) {
    let params =
      "variant=standard" +
      `&fen=${fen}` +
      "&speeds=rapid,blitz" +
      "&ratings=1600%2C1800%2C2000%2C2200" +
      "&source=analysis";

    let finalURL = "https://explorer.lichess.ovh/lichess?" + params;


    if (retrieveCache(finalURL)) {
      console.log("Cache hit", retrieveCache(finalURL) )
      return retrieveCache(finalURL);
    }

    //console.log("Going to hit ", finalURL);

    return await fetch(finalURL)
      .then((response) => response.json())
      .then((json) => {
        console.log("Got lichess response", json);

        saveCache(fen, json)

        return json
      })
      .catch((error) => {
        console.log("Got lichess error", error);
      });
}


let lines = [...document.querySelectorAll(".variation-card__moves")];

for (let line of lines) {
    let moves = [...line.querySelectorAll(".key")].map(a => a.innerHTML);
    console.log("moves:", moves);
    console.log("line text:", line);
    console.log("innerHTML", line.innerHTML.replaceAll(/<span class="key">/g, "").replaceAll(/<\/span>/g, ""));
}

