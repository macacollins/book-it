import React, { useState, useEffect, useRef, useCallback } from "react";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { SavedGameClient } from "../database/SavedGameClient";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { TinyFENDisplay } from "../pages/TinyFENDisplay";
import { GameRefresher } from "./GameRefresher";
import { GRBGameRow, GRBDiffWorkerOutbound } from "../workers/grbDiffTypes";
import {
  getGRBDiffInputSignature,
  GRB_DIFF_CACHE_MAX_AGE_MS,
} from "../analysis/grbDiffCache";
import { GRBDiffCacheClient } from "../database/GRBDiffCacheClient";

import { Chess } from "chess.js";

const getFENAfterTenMoves = (pgn: string): string | null => {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);

    while (chess.history().length > 10) {
      chess.undo();
    }

    return chess.fen();
  } catch {
    return null;
  }
};

export const GRBDiff = () => {
  const [rows, setRows] = useState<GRBGameRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<GRBGameRow | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const loadAnalysis = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    workerRef.current?.terminate();
    workerRef.current = null;

    const usernames = [
      localStorage.getItem("chessComUsername") || "",
      localStorage.getItem("lichessUsername") || "",
    ].filter(Boolean);
    const [allGames, grbs] = await Promise.all([
      SavedGameClient.getAll(),
      GradualRepertoireClient.getAll(),
    ]);

    if (requestId !== requestIdRef.current) return;

    const games = allGames
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 50);
    if (!games.length) {
      setRows([]);
      setLoading(false);
      return;
    }

    const inputSignatures = Object.fromEntries(
      games.map((game) => [
        game.id,
        getGRBDiffInputSignature(game, grbs, usernames),
      ]),
    );
    const cachedRows = await GRBDiffCacheClient.getByGameIds(
      games.map((game) => game.id),
    );
    if (requestId !== requestIdRef.current) return;

    const cachedByGameId = new Map(
      cachedRows.map((entry) => [entry.gameId, entry]),
    );
    const cachedDisplayRows = games.flatMap((game) => {
      const entry = cachedByGameId.get(game.id);
      return entry ? [entry.row] : [];
    });
    if (cachedDisplayRows.length > 0) setRows(cachedDisplayRows);

    const staleBefore = Date.now() - GRB_DIFF_CACHE_MAX_AGE_MS;
    const gamesToAnalyze = games.filter((game) => {
      const entry = cachedByGameId.get(game.id);
      return (
        !entry ||
        entry.inputSignature !== inputSignatures[game.id] ||
        entry.analyzedAt < staleBefore
      );
    });

    if (!gamesToAnalyze.length) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const worker = new Worker(
      new URL("../workers/GRBDiffWorker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<GRBDiffWorkerOutbound>) => {
      const msg = event.data;
      if (msg.requestId !== requestIdRef.current) return;

      if (msg.type === "GRB_DIFF_COMPLETE") {
        void GRBDiffCacheClient.putRows(msg.rows, inputSignatures)
          .then(() => {
            if (requestId !== requestIdRef.current) return;
            const freshRows = new Map(msg.rows.map((row) => [row.gameId, row]));
            setRows(games.flatMap((game) => {
              const cached = cachedByGameId.get(game.id)?.row;
              const fresh = freshRows.get(game.id);
              return fresh || cached ? [fresh || cached!] : [];
            }));
          })
          .catch((error) => {
            console.error("Unable to cache GRBDiff results:", error);
          })
          .finally(() => {
            if (requestId === requestIdRef.current) setLoading(false);
          });
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === "GRB_DIFF_ERROR") {
        console.error("GRBDiff worker error:", msg.error);
        setLoading(false);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.postMessage({
      type: "ANALYZE_GRB_DIFF",
      requestId,
      games: gamesToAnalyze,
      grbs,
      usernames,
    });
  }, []);

  useEffect(() => {
    void loadAnalysis();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [loadAnalysis]);

  const navigateToBuilder = (
    row: GRBGameRow,
    movesKey: "movesToBefore" | "movesToAfter",
  ) => {
    if (!row.match) return;
    const { matchedGRB } = row.match;
    const moves = row.match[movesKey];
    const movesParam =
      moves.length > 0 ? `?moves=${encodeURIComponent(moves.join(","))}` : "";
    window.location.hash = `#/gradual-repertoire/${matchedGRB.id}${movesParam}`;
    setSelectedRow(null);
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString();

  const repertoireNameBodyTemplate = (rowData: GRBGameRow) => {
    if (!rowData.match) return <span className="text-500">No Match</span>;
    return (
      <div>
        <p className="mb-3">
          <strong>Repertoire:</strong> {rowData.match.matchedGRB.name}
        </p>
        <p className="mb-3 text-500">
          <b>Uncovered move:</b> {rowData.match.uncoveredSAN}
        </p>
        <p className="mb-3 text-500">
          <b>Repertoire move{rowData.match.expectedSANs.length === 1 ? "" : "s"}:</b>{" "}
          {rowData.match.expectedSANs.join(", ")}
        </p>
      </div>
    );
  };
  const positionBodyTemplate = (rowData: GRBGameRow) => {
    if (!rowData.match) {
      const fen = getFENAfterTenMoves(rowData.savedGame.pgn);
      return fen ? (
        <TinyFENDisplay fen={fen} />
      ) : (
        <span className="text-500">Unable to load game</span>
      );
    }
      
    return <div>
            
            <div className="flex gap-4 justify-content-center">
              <div className="flex flex-column align-items-center gap-2">
                <span className="font-semibold">Before uncovered move</span>
                <TinyFENDisplay 
                  extraText="before" 
                  fen={rowData.match.beforeFEN} 
                  invert={rowData.match.userColor === "black"}
                  />
                <Button
                  label="Go to Builder"
                  size="small"
                  onClick={() =>
                    navigateToBuilder(rowData, "movesToBefore")
                  }
                />
              </div>
              <div className="flex flex-column align-items-center gap-2">
                <span className="font-semibold">After uncovered move</span>
                <TinyFENDisplay 
                  fen={rowData.match.afterFEN}
                  invert={rowData.match.userColor === "black"} 
                  />
                <Button
                  label="Go to Builder"
                  size="small"
                  onClick={() =>
                    navigateToBuilder(rowData, "movesToAfter")
                  }
                />
              </div>
            </div>
          </div>;
  };

  const addButtonBodyTemplate = (rowData: GRBGameRow) => (
    <Button
      label="Add..."
      size="small"
      outlined
      disabled={!rowData.match}
      onClick={() => setSelectedRow(rowData)}
    />
  );

  return (
    <div className="p-4">
      <div className="flex align-items-center gap-2 mb-3">
        <h1 className="m-0">GRB Game Analysis</h1>
        {loading && <ProgressSpinner style={{ width: "24px", height: "24px" }} />}
        <GameRefresher onGamesRefreshed={loadAnalysis} />
      </div>

      <DataTable
        value={rows}
        paginator
        rows={10}
        className="p-datatable-sm"
        emptyMessage="No games found"
      >
        <Column field="opponent" header="Opponent" style={{ width: "25%" }} />
        <Column
          header="Repertoire"
          body={repertoireNameBodyTemplate}
          style={{ width: "25%" }}
        />
        <Column
          header="Position"
          body={positionBodyTemplate}
          style={{ width: "55%" }}
        />
        <Column
          header="Add..."
          body={addButtonBodyTemplate}
          style={{ width: "20%" }}
        />
      </DataTable>

      {/* Position selection dialog */}
      <Dialog
        visible={!!selectedRow}
        onHide={() => setSelectedRow(null)}
        header={
          selectedRow?.match
            ? `${selectedRow.match.matchedGRB.name} — ${formatDate(selectedRow.gameTimestamp)}`
            : ""
        }
        style={{ width: "640px" }}
      >
        {selectedRow?.match && (
          <div>
            <p className="mb-3">
              <strong>Uncovered move:</strong>{" "}
              {selectedRow.match.uncoveredSAN}
            </p>
            <p className="mb-3 text-500">
              Choose which position to navigate to in the builder:
            </p>
            <div className="flex gap-4 justify-content-center">
              <div className="flex flex-column align-items-center gap-2">
                <span className="font-semibold">Before uncovered move</span>
                <TinyFENDisplay 
                  extraText="before" 
                  fen={selectedRow.match.beforeFEN} 
                  invert={selectedRow.match.userColor === "black"}
                  />
                <Button
                  label="Go to Builder"
                  size="small"
                  onClick={() =>
                    navigateToBuilder(selectedRow, "movesToBefore")
                  }
                />
              </div>
              <div className="flex flex-column align-items-center gap-2">
                <span className="font-semibold">After uncovered move</span>
                <TinyFENDisplay 
                  fen={selectedRow.match.afterFEN}
                  invert={selectedRow.match.userColor === "black"} 
                  />
                <Button
                  label="Go to Builder"
                  size="small"
                  onClick={() =>
                    navigateToBuilder(selectedRow, "movesToAfter")
                  }
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
