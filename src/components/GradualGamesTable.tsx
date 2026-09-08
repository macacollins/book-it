import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import crossReferenceGames, { GameMatch } from "../analysis/crossReferenceGames";
import { TinyFENDisplay } from "../pages/TinyFENDisplay";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";
import { useSinglePositionBuilderStore } from "./useSinglePositionBuilderStore";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect } from "react";
import pgnParser from "pgn-parser";

function displayFEN(fen: string): string {
  return `${fen} 0 1`;
}

export function GradualGamesTable({loadData}: { loadData: () => void}) {
    console.log("I render.");
  const repertoire = useGradualRepertoireBuilderStore((state) => state.setupResult);
  const matches = useSinglePositionBuilderStore(
    (state) =>
      (repertoire && (state?.gameMatches ?? {}))
    )

  const notGotEnoughData = !matches || !repertoire || !matches[repertoire?.id];

  useEffect(() => {
    if (notGotEnoughData)
      loadData()
  }, []);
 
  const navigateToBuilder = (match: GameMatch) => {
    if (!repertoire) return;
    debugger;
    const movesParam = encodeURIComponent((match?.longestMatch || []).join(","));
    window.location.hash = `#/gradual-repertoire/${repertoire.id}?moves=${movesParam}`;
  };

  if (notGotEnoughData) {
    return <ProgressSpinner />
  }

  return (
    <DataTable
      value={matches[repertoire?.id]}
      paginator
      rows={10}
      className="p-datatable-sm"
      emptyMessage="Run cross-reference games to find repertoire matches."
      sortField="game.timestamp"
      sortOrder={-1}
    >
      <Column
        header="Position"
        body={(match: GameMatch) => (
          <TinyFENDisplay
            fen={displayFEN(match.fen)}
            invert={repertoire?.color === "black"}
          />
        )}
      />
      <Column
        header="Game"
        field="game.timestamp"
        sortable
        body={(match: GameMatch) => {
          return <div className="flex flex-column gap-1">
            <span>{new Date(match.game.timestamp).toLocaleDateString()}</span>
            <span className="text-sm text-color-secondary">{match.game.source}</span>
            <span className="text-sm text-color-secondary">
              Game move was {match.nextGameMove}<br></br>
              Repertoire move was {match.nextRepertoireMoves?.join(", ")}
            </span>
          </div>
        }}
      />
      <Column
        header="Builder"
        body={(match: GameMatch) => (
          <Button
            label="Go to Builder"
            size="small"
            onClick={() => navigateToBuilder(match)}
          />
        )}
      />
    </DataTable>
  );
}