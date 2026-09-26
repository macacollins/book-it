import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import crossReferenceGames, {
  GameMatch,
} from "../analysis/crossReferenceGames";
import { TinyFENDisplay } from "../pages/TinyFENDisplay";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";
import { useSinglePositionBuilderStore } from "./useSinglePositionBuilderStore";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useState } from "react";
import pgnParser from "pgn-parser";
import {
  GameAnalysis,
  GameAnalysisClient,
  SavedGame,
  SavedGameClient,
} from "../database";

function displayFEN(fen: string): string {
  return `${fen} 0 1`;
}

export function GradualGamesTable() {
  console.log("I render.");
  const repertoire = useGradualRepertoireBuilderStore(
    (state) => state.setupResult,
  );
  const matches = useSinglePositionBuilderStore(
    (state) => repertoire && (state?.gameMatches ?? {}),
  );

  const [localAnalysisCache, setLocalAnalysisCache] = useState<GameAnalysis[]>(
    [],
  );

  const notGotEnoughData =
    !localAnalysisCache || localAnalysisCache.length == 0;

  useEffect(() => {
    (async function () {
      if (repertoire && notGotEnoughData) {
        const games = 3;
        const games2 = await GameAnalysisClient.getByRepertoireID(
          repertoire.id,
        );

        games2.sort((a: GameAnalysis, b: GameAnalysis) => {
          return a.analysisData.timestamp > b.analysisData.timestamp ? -1 : 1;
        });
        setLocalAnalysisCache(games2);
      }
    })();
  }, [repertoire]);

  const navigateToBuilder = (match: GameAnalysis) => {
    if (!repertoire) return;
    const movesParam = encodeURIComponent(
      (match?.analysisData.movesToBefore || []).join(","),
    );
    window.location.hash = `#/gradual-repertoire/${repertoire.id}?moves=${movesParam}`;
  };

  if (notGotEnoughData) {
    return <ProgressSpinner />;
  }

  return (
    <DataTable
      value={localAnalysisCache}
      paginator
      rows={10}
      className="p-datatable-sm"
      emptyMessage="Run cross-reference games to find repertoire matches."
      sortField="game.timestamp"
      sortOrder={-1}
    >
      <Column
        header="Position"
        body={(match: GameAnalysis) => (
          <>
            <TinyFENDisplay
              fen={match.analysisData.beforeFEN}
              invert={repertoire?.color === "black"}
              extraText={match.analysisData.gameID}
            />
          </>
        )}
      />
      <Column
        header="Game"
        field="analysisData."
        sortable
        body={(match: GameAnalysis) => {
          return (
            <div className="flex flex-column gap-1">
              <span>
                {new Date(
                  match.analysisData.headers["UTCDate"],
                ).toLocaleDateString()}
              </span>
              <span className="text-sm text-color-secondary">
                {match.gameID}
              </span>
              <span className="text-sm text-color-secondary">
                Game move was {match.analysisData.uncoveredSAN}
                <br></br>
                Repertoire move was{" "}
                {match.analysisData.expectedSANs?.join(", ")}
              </span>
            </div>
          );
        }}
      />
      <Column
        header="Builder"
        body={(match: GameAnalysis) => (
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
