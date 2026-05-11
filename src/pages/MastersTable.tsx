// Want to store in dexie

// hierarchy will be /masters/{mastername}
// these pgns can be large-ish so storage in IndexedDB is preferable.
// We should display the size and allow the user to remove a repertoire while maintaining access to their notes.
// later

// for now we can just mash it in there
// prototype we can even use localstorage

import { useEffect, useState } from "react";
import pgnParser, { ParsedPGN } from "pgn-parser";
import { ProgressSpinner } from "primereact/progressspinner";
import { DataTable } from "primereact/datatable";
import getKeyValueHeaders from "../pgn/getKeyValueHeaders";
import { Column } from "primereact/column";
import { getItemDexie, setItemDexie } from "../storage";
import { Button } from "primereact/button";
import { useNavigate, useParams } from "react-router";

const masters = {};

export default function MastersTable() {
  const navigate = useNavigate();

  const { master = "morphy" } = useParams();

  const [allGames, setAllGames] = useState<ParsedPGN[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    const url = masters[master as keyof typeof masters];

    async function test() {
      let cachedGames = await getItemDexie(master + "Games");

      console.log("Dexie returned", cachedGames);

      if (!cachedGames || cachedGames.length === 0) {
        const res = await fetch(url);
        const text = await res.text();

        console.log("Retrieved morphy successfully.");
        const parsedPGNs: ParsedPGN[] = pgnParser.parse(text);

        await setItemDexie(master + "Games", parsedPGNs);

        cachedGames = parsedPGNs;
      }

      setAllGames(
        cachedGames
          .map(getKeyValueHeaders)
          .map((kvHeaders: Record<string, any>, index: number) => {
            kvHeaders.ID = index;
            return augmentWithWordCounts(master, kvHeaders);
          }),
      );

      if (cachedGames.length) {
        const exampleHeaders = getKeyValueHeaders(cachedGames[0]);

        setColumns([
          ...Object.keys(exampleHeaders).filter(
            (header) =>
              ["Site", "Round", "WhiteElo", "BlackElo"].indexOf(header) === -1,
          ),
          "Word Count",
        ]);
      }
    }

    if (url) {
      test();
    }
  }, []);

  const makeLink = (rowData: any) => {
    return (
      <a target="_blank" href={`https://chessopenings.com/eco/${rowData.ECO}/`}>
        {rowData.ECO}
      </a>
    );
  };

  const actionButton = (rowData: any) => {
    return (
      <Button
        onClick={() => {
          const target = "/book-it/masters/" + master + "/" + rowData.ID;
          console.log("What up", target);
          // debugger;

          navigate(target);
        }}
        label={"annotate"}
      />
    );
  };

  let renderedColumns = columns.map((columnName) => (
    <Column
      field={columnName}
      sortable
      filter
      header={columnName}
      body={columnName === "ECO" && makeLink}
    />
  ));

  const morphyIndex = (
    <DataTable value={allGames}>
      {renderedColumns}
      <Column body={actionButton} header=""></Column>
    </DataTable>
  );

  return allGames?.length ? morphyIndex : <ProgressSpinner />;
}

function augmentWithWordCounts(master: string, kvHeaders: any) {
  const key = master + "-" + kvHeaders.ID + "-annotations";

  const localStorageValue = localStorage.getItem(key);

  if (localStorageValue) {
    try {
      const parsed = JSON.parse(localStorageValue);
      const wordCount = Object.values(parsed).join(" ").split(" ").length;

      kvHeaders["Word Count"] = wordCount;
    } catch (e) {
      console.log(
        "Encountered error when enriching annotations for game with ID " +
          kvHeaders.ID,
      );
      kvHeaders["Word Count"] = 0;
    }
  } else {
    kvHeaders["Word Count"] = 0;
  }

  return kvHeaders;
}
