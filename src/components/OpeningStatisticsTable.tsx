import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Panel } from "primereact/panel";
import { Badge } from "primereact/badge";
import { GameJson } from "../integrations/lichess-client";

interface OpeningStatisticsTableProps {
  games: GameJson[];
  username: string;
}

const OpeningStatisticsTable: React.FC<OpeningStatisticsTableProps> = ({
  games,
  username,
}) => {
  const [expandedRowsWhite, setExpandedRowsWhite] = useState<any>(null);
  const [expandedRowsBlack, setExpandedRowsBlack] = useState<any>(null);

  const getOpeningStatsByColor = (asWhite: boolean) => {
    const baseOpeningStats: Record<
      string,
      {
        opening: string;
        eco: string;
        wins: number;
        draws: number;
        losses: number;
        totalGames: number;
        winRate: number;
        variations: Array<{
          fullName: string;
          eco: string;
          wins: number;
          draws: number;
          losses: number;
          totalGames: number;
          winRate: number;
        }>;
      }
    > = {};

    const searchedUser = username.trim().toLowerCase();

    games.forEach((game) => {
      if (!game.opening) return;

      // Filter by color
      const whitePlayer = game.players.white.user?.name?.toLowerCase();
      const blackPlayer = game.players.black.user?.name?.toLowerCase();
      const userIsWhite = whitePlayer === searchedUser;
      const userIsBlack = blackPlayer === searchedUser;

      // Skip if user wasn't playing the requested color
      if (asWhite && !userIsWhite) return;
      if (!asWhite && !userIsBlack) return;

      // Extract base opening name (before colon)
      const baseName = game.opening.name.split(":")[0].trim();
      const fullName = game.opening.name;

      // Initialize base opening if not exists
      if (!baseOpeningStats[baseName]) {
        baseOpeningStats[baseName] = {
          opening: baseName,
          eco: game.opening.eco,
          wins: 0,
          draws: 0,
          losses: 0,
          totalGames: 0,
          winRate: 0,
          variations: [],
        };
      }

      // Find or create variation
      let variation = baseOpeningStats[baseName].variations.find(
        (v) => v.fullName === fullName,
      );
      if (!variation) {
        variation = {
          fullName,
          eco: game.opening.eco,
          wins: 0,
          draws: 0,
          losses: 0,
          totalGames: 0,
          winRate: 0,
        };
        baseOpeningStats[baseName].variations.push(variation);
      }

      // Determine result
      let isWin = false;
      let isDraw = false;

      if (!game.winner) {
        isDraw = true;
      } else if (
        (game.winner === "white" && userIsWhite) ||
        (game.winner === "black" && userIsBlack)
      ) {
        isWin = true;
      }

      // Update base opening stats
      baseOpeningStats[baseName].totalGames++;
      if (isWin) {
        baseOpeningStats[baseName].wins++;
      } else if (isDraw) {
        baseOpeningStats[baseName].draws++;
      } else {
        baseOpeningStats[baseName].losses++;
      }

      // Update variation stats
      variation.totalGames++;
      if (isWin) {
        variation.wins++;
      } else if (isDraw) {
        variation.draws++;
      } else {
        variation.losses++;
      }

      // Calculate score rates
      baseOpeningStats[baseName].winRate =
        ((baseOpeningStats[baseName].wins +
          baseOpeningStats[baseName].draws * 0.5) /
          baseOpeningStats[baseName].totalGames) *
        100;
      variation.winRate =
        ((variation.wins + variation.draws * 0.5) / variation.totalGames) * 100;
    });

    // Sort variations within each opening
    Object.values(baseOpeningStats).forEach((opening) => {
      opening.variations.sort((a, b) => b.totalGames - a.totalGames);
    });

    return Object.values(baseOpeningStats).sort(
      (a, b) => b.totalGames - a.totalGames,
    );
  };

  const renderOpeningTable = (asWhite: boolean) => {
    const data = getOpeningStatsByColor(asWhite);
    const expandedRows = asWhite ? expandedRowsWhite : expandedRowsBlack;
    const setExpandedRows = asWhite
      ? setExpandedRowsWhite
      : setExpandedRowsBlack;
    const colorLabel = asWhite ? "White" : "Black";

    return (
      <Panel
        header={`Opening Statistics - Playing as ${colorLabel} (${data.reduce((sum, item) => sum + item.totalGames, 0)} games)`}
        className="mb-4"
      >
        <DataTable
          value={data}
          paginator
          rows={10}
          dataKey="opening"
          emptyMessage={`No opening data found for games as ${colorLabel.toLowerCase()}`}
          className="p-datatable-sm"
          sortField="totalGames"
          sortOrder={-1}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={(rowData) => (
            <div style={{ padding: "1rem" }}>
              <h4
                style={{
                  marginBottom: "0.5rem",
                  color: "var(--text-color-secondary)",
                }}
              >
                Variations of {rowData.opening} (as {colorLabel})
              </h4>
              <DataTable
                value={rowData.variations}
                className="p-datatable-sm"
                emptyMessage="No variations found"
              >
                <Column
                  field="fullName"
                  header="Full Opening Name"
                  style={{ width: "400px" }}
                  body={(varData) => (
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {varData.fullName}
                      </div>
                      <div
                        style={{
                          color: "var(--text-color-secondary)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {varData.eco}
                      </div>
                    </div>
                  )}
                />
                <Column
                  field="totalGames"
                  header="Games"
                  style={{ width: "80px", textAlign: "center" }}
                />
                <Column
                  header="Record"
                  style={{ width: "120px", textAlign: "center" }}
                  body={(varData) => (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        justifyContent: "center",
                      }}
                    >
                      <Badge value={`W: ${varData.wins}`} severity="success" />
                      <Badge value={`D: ${varData.draws}`} severity="info" />
                      <Badge value={`L: ${varData.losses}`} severity="danger" />
                    </div>
                  )}
                />
                <Column
                  header="Score Rate"
                  style={{ width: "100px", textAlign: "center" }}
                  body={(varData) => {
                    const scoreRate =
                      varData.totalGames > 0
                        ? (
                            ((varData.wins + varData.draws * 0.5) /
                              varData.totalGames) *
                            100
                          ).toFixed(1)
                        : "0.0";
                    return `${scoreRate}%`;
                  }}
                />
                <Column
                  header="Performance"
                  style={{ width: "120px", textAlign: "center" }}
                  body={(varData) => {
                    const performanceNum =
                      varData.totalGames > 0
                        ? ((varData.wins + varData.draws * 0.5) /
                            varData.totalGames) *
                          100
                        : 0;
                    const performance = performanceNum.toFixed(1);
                    const severity =
                      performanceNum >= 60
                        ? "success"
                        : performanceNum >= 40
                          ? "warning"
                          : "danger";
                    return (
                      <Badge value={`${performance}%`} severity={severity} />
                    );
                  }}
                />
              </DataTable>
            </div>
          )}
        >
          <Column expander style={{ width: "3rem" }} />
          <Column
            field="opening"
            header="Opening"
            style={{ width: "300px" }}
            body={(rowData) => (
              <div>
                <div style={{ fontWeight: "bold" }}>{rowData.opening}</div>
                <div
                  style={{
                    color: "var(--text-color-secondary)",
                    fontSize: "0.9rem",
                  }}
                >
                  {rowData.variations.length} variation
                  {rowData.variations.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          />
          <Column
            field="totalGames"
            header="Games"
            sortable
            style={{ width: "80px", textAlign: "center" }}
          />
          <Column
            header="Record"
            style={{ width: "120px", textAlign: "center" }}
            body={(rowData) => (
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                  justifyContent: "center",
                }}
              >
                <Badge value={`W: ${rowData.wins}`} severity="success" />
                <Badge value={`D: ${rowData.draws}`} severity="info" />
                <Badge value={`L: ${rowData.losses}`} severity="danger" />
              </div>
            )}
          />
          <Column
            header="Score Rate"
            style={{ width: "100px", textAlign: "center" }}
            body={(rowData) => {
              const scoreRate =
                rowData.totalGames > 0
                  ? (
                      ((rowData.wins + rowData.draws * 0.5) /
                        rowData.totalGames) *
                      100
                    ).toFixed(1)
                  : "0.0";
              return `${scoreRate}%`;
            }}
            sortable
            sortField="winRate"
          />
          <Column
            header="Performance"
            style={{ width: "120px", textAlign: "center" }}
            body={(rowData) => {
              const performanceNum =
                rowData.totalGames > 0
                  ? ((rowData.wins + rowData.draws * 0.5) /
                      rowData.totalGames) *
                    100
                  : 0;
              const performance = performanceNum.toFixed(1);
              const severity =
                performanceNum >= 60
                  ? "success"
                  : performanceNum >= 40
                    ? "warning"
                    : "danger";
              return <Badge value={`${performance}%`} severity={severity} />;
            }}
          />
        </DataTable>
      </Panel>
    );
  };

  if (games.length === 0) {
    return null;
  }

  return (
    <div>
      {renderOpeningTable(true)}
      {renderOpeningTable(false)}
    </div>
  );
};

export default OpeningStatisticsTable;
