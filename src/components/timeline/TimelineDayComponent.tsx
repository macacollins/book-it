import { Column } from "primereact/column";

import { DataTable, DataTableRowMouseEvent } from "primereact/datatable";
import { useTimelineStore } from "./useTimelineStore";
import { GRBGameRow } from "../../workers/grbDiffTypes";
import { SavedGame } from "../../database";
import { useState } from "react";
import { TinyFENDisplay } from "../../pages/TinyFENDisplay";
import GameViewer from "./GameViewer";
import { TimelineDay } from "./types";

interface TimelineDayComponentProps {
  day: TimelineDay;
}

interface RowViewModel {
  grbGameRow: GRBGameRow;
  game: SavedGame;
}

export default function ({ day }: TimelineDayComponentProps) {
  const { gameMatchResultCache } = useTimelineStore();
  const [currentlyDebuggingIndex, setCurrentlyDebuggingIndex] =
    useState<number>(-1);
  const [expandedRows, setExpandedRows] = useState(null);
  const cacheEntries = Object.keys(gameMatchResultCache).length;
  const repertoireTemplate = (rowData: SavedGame) => {
    return;
  };
  if (day.results.length && cacheEntries) {
    let compositeEntries: RowViewModel[] = [];

    for (let result of day.results) {
      const newEntry: RowViewModel = {
        game: result,
        grbGameRow: gameMatchResultCache[result.id],
      };

      compositeEntries.push(newEntry);
    }
    const onRowExpand = (event: any) => {
      // toast.current.show({
      //   severity: "info",
      //   summary: "Product Expanded",
      //   detail: event.data.name,
      //   life: 3000,
      // });
      console.log("onRowExpand", event);
    };

    const onRowCollapse = (event: any) => {
      console.log(event);
      // toast.current.show({
      //   severity: "success",
      //   summary: "Product Collapsed",
      //   detail: event.data.name,
      //   life: 3000,
      // });
    };
    return (
      <div key={day.name}>
        <h3>{day.name}</h3>
        <DataTable
          size="small"
          value={compositeEntries}
          // onRowClick={(rowData: DataTableRowMouseEvent) => {
          //   console.log(compositeEntries[rowData.index]);
          // }}
          rowExpansionTemplate={(e: RowViewModel) => {
            return (
              <div className="flex gap-2">
                <TinyFENDisplay
                  fen={e.grbGameRow.match?.beforeFEN ?? ""}
                  invert={e.grbGameRow.match?.userColor === "black"}
                ></TinyFENDisplay>
                <div>
                  <div>Move played: {e.grbGameRow.match?.uncoveredSAN}</div>
                  {e.grbGameRow.match?.expectedSANs.length ? (
                    <div>
                      Expected one of:{" "}
                      {e.grbGameRow.match?.expectedSANs.join(", ")}
                    </div>
                  ) : (
                    <div>No expected move found.</div>
                  )}
                </div>
                <div>
                  <GameViewer
                    game={e.game}
                    startingMove={e.grbGameRow.match?.movesToBefore.length || 0}
                  />
                </div>
                {/* <pre>{JSON.stringify(e, undefined, 2)}</pre> */}
              </div>
            );
          }}
          expandedRows={expandedRows as any}
          onRowToggle={(e) => setExpandedRows(e.data as any)}
          onRowExpand={onRowExpand}
          onRowCollapse={onRowCollapse}
          onRowClick={(e) => setExpandedRows}
        >
          <Column expander={true} style={{ width: "3rem" }} />
          <Column header="ID" field="game.id" sortable />
          <Column
            header="Repertoire"
            field="grbGameRow.match.matchedGRBName"
            sortable
          />
          <Column
            header="Won"
            field="grbGameRow.match.userWon"
            sortable
            filter
          />
          <Column
            header="User Diverged"
            field="grbGameRow.match.userDiverged"
            filter
            sortable
          />
          <Column
            header="Uncovered SAN"
            field="grbGameRow.match.uncoveredSAN"
          />
          <Column header="User Color" field={"grbGameRow.match.expectedSANs"} />
        </DataTable>
      </div>
    );
    // do stuff
  } else if (day.results.length) {
    const games = day.results.map((result) => {
      return <div key={result.id}>{result.id}</div>;
    });

    return (
      <div key={day.name}>
        <h3>{day.name}</h3>
        {games}
      </div>
    );
  } else {
    return <div>No results found.</div>;
  }
}
