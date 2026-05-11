import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TinyFENDisplay } from "./TinyFENDisplay";
import {
  LichessClient,
  OpeningExplorerMasters,
  OpeningExplorerMastersGame,
} from "../integrations/lichess-client";

export function HomePage() {
  const [fen, setFen] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );
  const [loading, setLoading] = useState(false);
  const [mastersData, setMastersData] = useState<OpeningExplorerMasters | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const lichessClient = new LichessClient();

  const handleImport = async () => {
    if (!fen.trim()) {
      setError("Please enter a valid FEN");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await lichessClient.openingExplorerMaster({
        fen: fen.trim(),
        moves: 20,
        topGames: 15,
      });
      setMastersData(result);
    } catch (err) {
      setError(
        "Failed to fetch masters games: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPlayerName = (game: OpeningExplorerMastersGame) => {
    return `${game.white.name} vs ${game.black.name}`;
  };

  const formatResult = (game: OpeningExplorerMastersGame) => {
    const result =
      game.winner === "white"
        ? "1-0"
        : game.winner === "black"
          ? "0-1"
          : "1/2-1/2";
    return result;
  };

  const formatYear = (game: OpeningExplorerMastersGame) => {
    return game.year || "Unknown";
  };

  return (
    <div className="p-4">
      <h1>Chess Position Explorer</h1>

      <div className="flex flex-column gap-3 mb-4">
        <label htmlFor="fen-input" className="font-semibold">
          FEN
        </label>
        <InputText
          id="fen-input"
          value={fen}
          onChange={(e) => setFen(e.target.value)}
          placeholder="Enter FEN notation..."
          className="w-full"
        />

        <Button
          label="Import"
          onClick={handleImport}
          loading={loading}
          disabled={!fen.trim()}
          className="w-auto"
        />
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {fen && (
        <div className="mb-4">
          <h3>Position Preview</h3>
          <TinyFENDisplay fen={fen} />
        </div>
      )}

      {mastersData && (
        <div>
          <h3>
            Masters Games ({mastersData.topGames?.length || 0} games found)
          </h3>

          {mastersData.opening && (
            <div className="mb-3">
              <strong>Opening:</strong> {mastersData.opening.name || "Unknown"}
              {mastersData.opening.eco && (
                <span className="ml-2 text-sm text-gray-600">
                  ({mastersData.opening.eco})
                </span>
              )}
            </div>
          )}

          {mastersData.topGames && mastersData.topGames.length > 0 && (
            <DataTable
              value={mastersData.topGames}
              paginator
              rows={10}
              className="p-datatable-sm"
              emptyMessage="No games found"
            >
              <Column
                field="players"
                header="Players"
                body={(game) => formatPlayerName(game)}
                style={{ width: "40%" }}
              />
              <Column
                field="result"
                header="Result"
                body={(game) => formatResult(game)}
                style={{ width: "15%" }}
              />
              <Column
                field="year"
                header="Year"
                body={(game) => formatYear(game)}
                style={{ width: "15%" }}
              />
              <Column field="id" header="Game ID" style={{ width: "30%" }} />
            </DataTable>
          )}

          {mastersData.moves && mastersData.moves.length > 0 && (
            <div className="mt-4">
              <h4>Popular Moves</h4>
              <div className="grid">
                {mastersData.moves.slice(0, 6).map((move, index) => (
                  <div key={index} className="col-12 md:col-6 lg:col-4">
                    <div className="border border-gray-300 p-3 rounded">
                      <div className="font-semibold">{move.san}</div>
                      <div className="text-sm text-gray-600">
                        W: {move.white} D: {move.draws} B: {move.black}
                      </div>
                      {move.averageRating && (
                        <div className="text-sm text-gray-500">
                          Avg Rating: {move.averageRating}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
