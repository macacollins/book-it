import { Button } from "primereact/button";
import { useState } from "react";
import { TinyFENDisplay } from "./TinyFENDisplay";
import { useParams } from "react-router";
import { ProgressBar } from "primereact/progressbar";
import { Checkbox } from "primereact/checkbox";
import {
  getLichessAnalysis,
  getLichessMastersAnalysis,
} from "../integrations/lichess.org";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export default function GameSearcher() {
  let queryParams = new URLSearchParams(window.location.search);

  let fen = decodeURI(location.toString().split("?fen=")[1]);

  const [games, setGames] = useState([]);
  const [masterGames, setMasterGames] = useState([]);
  const [spider, setSpider] = useState(false);

  async function downloadGames() {
    const analysisRaw = await getLichessAnalysis(fen);
    const analysis = await analysisRaw.json();
    console.log("Got analysis", analysis);
    setGames(analysis.recentGames);

    const mastersAnalysisRaw = await getLichessMastersAnalysis(fen);
    const mastersAnalysis = await mastersAnalysisRaw.json();
    console.log("Got masters analysis", mastersAnalysis);
    setMasterGames(mastersAnalysis.topGames);
  }

  return (
    <>
      <h1>Game Searcher</h1>
      <TinyFENDisplay fen={fen || "blank"} />
      <section className="flex flex-column gap-2">
        <label className="flex justify-content-center align-items-middle">
          <Checkbox
            checked={spider}
            onClick={() => setSpider(!spider)}
          ></Checkbox>
          Spider?
        </label>
        <Button
          className="w-8"
          label="Download Games"
          onClick={downloadGames}
        ></Button>
      </section>
      {/* <ProgressBar ></ProgressBar> */}
      <h2>Lichess Games</h2>
      <DataTable value={games}>
        <Column
          field="id"
          header="ID"
          body={({ id }) => (
            <a href={"https://lichess.org/" + id} target="_blank">
              {id}
            </a>
          )}
        ></Column>
        <Column field="white.name" header="White"></Column>
        <Column field="white.rating" header="White Rating"></Column>
        <Column field="black.name" header="Black"></Column>
        <Column field="black.rating" header="Black Rating"></Column>
      </DataTable>

      <h2>Master Games</h2>
      <DataTable value={masterGames}>
        <Column
          field="id"
          header="ID"
          body={({ id }) => (
            <a href={"https://lichess.org/" + id} target="_blank">
              {id}
            </a>
          )}
        ></Column>
        <Column field="white.name" header="White"></Column>
        <Column field="white.rating" header="White Rating"></Column>
        <Column field="black.name" header="Black"></Column>
        <Column field="black.rating" header="Black Rating"></Column>
      </DataTable>
    </>
  );
}
