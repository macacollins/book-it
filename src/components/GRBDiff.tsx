import React, { useState, useEffect, useRef } from "react";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { SavedGameClient } from "../database/SavedGameClient";
import { GradualRepertoire, SavedGame } from "../database/types";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { TinyFENDisplay } from "../pages/TinyFENDisplay";
import { GameRefresher } from "./GameRefresher";
import { GRBMatchResult } from "../analysis/matchGameToGRB";
import { GRBGameRow, GRBDiffWorkerOutbound } from "../workers/grbDiffTypes";

import { Chess } from "chess.js";
export const GRBDiff = () => {
  const [grbs, setGrbs] = useState<GradualRepertoire[]>([]);
  const [games, setGames] = useState<SavedGame[]>([]);
  const [rows, setRows] = useState<GRBGameRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<GRBGameRow | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const usernames = [
    localStorage.getItem("chessComUsername") || "",
    localStorage.getItem("lichessUsername") || "",
  ].filter(Boolean);

  // Load all GRBs on mount
  useEffect(() => {
    GradualRepertoireClient.getAll().then(setGrbs);
  }, []);

  const loadGames = async () => {
    const allGames = await SavedGameClient.getAll();
    const sorted = allGames
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
    setGames(sorted);
  };

  useEffect(() => {
    loadGames();
  }, []);

  // Analyse games via web worker whenever GRBs or games change
  useEffect(() => {
    // Terminate any in-flight worker
    workerRef.current?.terminate();
    workerRef.current = null;

    if (!games.length) {
      setRows([]);
      return;
    }

    setRows([]);
    setLoading(true);

    const worker = new Worker(
      new URL("../workers/GRBDiffWorker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<GRBDiffWorkerOutbound>) => {
      const msg = event.data;
      if (msg.type === "GRB_DIFF_ROW") {
        setRows((prev) => [...prev, msg.row]);
      } else if (msg.type === "GRB_DIFF_COMPLETE") {
        setLoading(false);
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === "GRB_DIFF_ERROR") {
        console.error("GRBDiff worker error:", msg.error);
        setLoading(false);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.postMessage({ type: "ANALYZE_GRB_DIFF", games, grbs, usernames });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [grbs, games]);

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
      </div>
    );
  };
  const positionBodyTemplate = (rowData: GRBGameRow) => {
    if (!rowData.match) {
      return <span className="text-500">{rowData.savedGame.pgn}</span>;
    }
      
    return <div>
            <p className="mb-3">
              <strong>Uncovered move:</strong>{" "}
              {rowData.match.uncoveredSAN}
            </p>
            <p className="mb-3 text-500">
              Choose which position to navigate to in the builder:
            </p>
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
        <GameRefresher onGamesRefreshed={loadGames} />
      </div>

      <DataTable
        value={rows}
        paginator
        loading={loading}
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
