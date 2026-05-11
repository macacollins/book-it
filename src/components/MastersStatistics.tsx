import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import {
  LichessClient,
  OpeningExplorerMasters,
  OpeningExplorerMastersGame,
} from "../integrations/lichess-client";

interface MastersStatisticsProps {
  fen: string;
}

interface GameStats {
  total: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
  whitePercentage: number;
  blackPercentage: number;
  drawPercentage: number;
}

export default function MastersStatistics({ fen }: MastersStatisticsProps) {
  const [data, setData] = useState<OpeningExplorerMasters | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lichessClient = new LichessClient();

  useEffect(() => {
    const fetchMastersData = async () => {
      if (!fen) return;

      setLoading(true);
      setError(null);

      try {
        const mastersData = await lichessClient.openingExplorerMaster({
          fen,
          topGames: 10,
          moves: 12,
        });
        setData(mastersData);
      } catch (err) {
        setError(
          `Failed to load masters data: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMastersData();
  }, [fen]);

  const calculateStats = (): GameStats | null => {
    if (!data) return null;

    const total = data.white + data.black + data.draws;
    if (total === 0) return null;

    return {
      total,
      whiteWins: data.white,
      blackWins: data.black,
      draws: data.draws,
      whitePercentage: (data.white / total) * 100,
      blackPercentage: (data.black / total) * 100,
      drawPercentage: (data.draws / total) * 100,
    };
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const yearTemplate = (rowData: OpeningExplorerMastersGame) => {
    return rowData.month ? `${rowData.year}/${rowData.month}` : rowData.year;
  };

  const playerNamesTemplate = (rowData: OpeningExplorerMastersGame) => {
    return `${rowData.white.name} vs ${rowData.black.name}`;
  };

  const winnerTemplate = (rowData: OpeningExplorerMastersGame) => {
    if (rowData.winner === "white") return "White";
    if (rowData.winner === "black") return "Black";
    return "Draw";
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center p-4">
        <ProgressSpinner />
        <span className="ml-2">Loading masters data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <Message severity="error" text={error} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-3">
        <Message
          severity="info"
          text="No masters data available for this position"
        />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="p-3">
      <h3 className="mt-0">Masters Database Statistics</h3>

      {data.opening && (
        <Card className="mb-3">
          <div className="grid">
            <div className="col-12">
              <h4 className="mt-0">{data.opening.name}</h4>
              <p className="text-color-secondary mb-0">
                ECO: {data.opening.eco}
              </p>
            </div>
          </div>
        </Card>
      )}

      {stats && (
        <Card className="mb-3" title="Overall Statistics">
          <div className="grid">
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-color-secondary">Total Games</div>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {stats.whiteWins}
                </div>
                <div className="text-color-secondary">
                  White Wins ({formatPercentage(stats.whitePercentage)})
                </div>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.draws}</div>
                <div className="text-color-secondary">
                  Draws ({formatPercentage(stats.drawPercentage)})
                </div>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.blackWins}</div>
                <div className="text-color-secondary">
                  Black Wins ({formatPercentage(stats.blackPercentage)})
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {data.topGames && data.topGames.length > 0 && (
        <Card title="Recent Master Games">
          <DataTable
            value={data.topGames}
            size="small"
            stripedRows
            className="p-datatable-sm"
          >
            <Column
              field="year"
              header="Date"
              body={yearTemplate}
              style={{ width: "100px" }}
            />
            <Column
              header="Players"
              body={playerNamesTemplate}
              style={{ minWidth: "250px" }}
            />
            <Column
              header="Result"
              body={winnerTemplate}
              style={{ width: "80px" }}
            />
          </DataTable>
        </Card>
      )}

      {data.moves && data.moves.length > 0 && (
        <Card title="Popular Moves" className="mt-3">
          <DataTable
            value={data.moves}
            size="small"
            stripedRows
            className="p-datatable-sm"
          >
            <Column field="san" header="Move" style={{ width: "80px" }} />
            <Column
              field="white"
              header="White Wins"
              style={{ width: "100px" }}
            />
            <Column field="draws" header="Draws" style={{ width: "80px" }} />
            <Column
              field="black"
              header="Black Wins"
              style={{ width: "100px" }}
            />
          </DataTable>
        </Card>
      )}
    </div>
  );
}
