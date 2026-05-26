import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { SavedGameClient } from "../database/SavedGameClient";
import { GradualRepertoire, SavedGame } from "../database/types";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { TinyFENDisplay } from "../pages/TinyFENDisplay";
import { GameRefresher } from "./GameRefresher";
import { matchGameToGRB, GRBMatchResult } from "../analysis/matchGameToGRB";

interface GRBGameRow {
  gameId: string;
  gameTimestamp: number;
  opponent: string;
  match: GRBMatchResult | null;
}

function getOpponentFromPGN(pgn: string, usernames: string[]): string {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const headers = chess.header();
    const white = headers["White"] || "";
    const black = headers["Black"] || "";
    const normalized = usernames.map((u) => u.trim().toLowerCase());
    if (normalized.some((u) => u === white.toLowerCase())) return black;
    if (normalized.some((u) => u === black.toLowerCase())) return white;
    return black || "Unknown";
  } catch {
    return "Unknown";
  }
}

export const GRBDiff = () => {
  const [grbs, setGrbs] = useState<GradualRepertoire[]>([]);
  const [games, setGames] = useState<SavedGame[]>([]);
  const [rows, setRows] = useState<GRBGameRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<GRBGameRow | null>(null);

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

  // Analyse games whenever GRBs or games change
  useEffect(() => {
    if (!games.length) {
      setRows([]);
      return;
    }

    setLoading(true);
    const analyzed: GRBGameRow[] = games.map((game) => {
      const match = matchGameToGRB(game, grbs, usernames);
      const opponent = match
        ? match.opponent
        : getOpponentFromPGN(game.pgn, usernames);
      return {
        gameId: game.id,
        gameTimestamp: game.timestamp,
        opponent: opponent || "Unknown",
        match,
      };
    });
    setRows(analyzed);
    setLoading(false);
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

  const positionBodyTemplate = (rowData: GRBGameRow) => {
    if (!rowData.match) return <span className="text-500">No Match</span>;
    return <TinyFENDisplay fen={rowData.match.beforeFEN} />;
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
        rows={10}
        className="p-datatable-sm"
        emptyMessage="No games found"
        loading={loading}
      >
        <Column field="opponent" header="Opponent" style={{ width: "25%" }} />
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
                <TinyFENDisplay extraText="before" fen={selectedRow.match.beforeFEN} />
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
                <TinyFENDisplay fen={selectedRow.match.afterFEN} />
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
