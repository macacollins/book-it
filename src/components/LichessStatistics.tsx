import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { LichessClient, OpeningExplorerLichess, OpeningExplorerLichessGame } from '../integrations/lichess-client';

interface LichessStatisticsProps {
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
  averageRating?: number;
}

interface MoveWithStats {
  san: string;
  uci: string;
  white: number;
  draws: number;
  black: number;
  total: number;
  whitePercentage: number;
  averageRating: number;
}

export default function LichessStatistics({ fen }: LichessStatisticsProps) {
  const [data, setData] = useState<OpeningExplorerLichess | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lichessClient = new LichessClient();

  useEffect(() => {
    const fetchLichessData = async () => {
      if (!fen) return;

      setLoading(true);
      setError(null);

      try {
        const lichessData = await lichessClient.openingExplorerLichess({
          fen,
          topGames: 10,
          moves: 12
        });
        setData(lichessData);
      } catch (err) {
        setError(`Failed to load Lichess data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLichessData();
  }, [fen]);

  const calculateStats = (): GameStats | null => {
    if (!data) return null;

    const total = data.white + data.black + data.draws;
    if (total === 0) return null;

    // Calculate average rating from moves if available
    let averageRating: number | undefined;
    if (data.moves && data.moves.length > 0) {
      const totalRating = data.moves.reduce((sum, move) => sum + (move.averageRating || 0), 0);
      const validMoves = data.moves.filter(move => move.averageRating > 0);
      if (validMoves.length > 0) {
        averageRating = totalRating / validMoves.length;
      }
    }

    return {
      total,
      whiteWins: data.white,
      blackWins: data.black,
      draws: data.draws,
      whitePercentage: (data.white / total) * 100,
      blackPercentage: (data.black / total) * 100,
      drawPercentage: (data.draws / total) * 100,
      averageRating
    };
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const formatMoves = (): MoveWithStats[] => {
    if (!data || !data.moves) return [];

    return data.moves.map(move => {
      const total = move.white + move.black + move.draws;
      return {
        san: move.san,
        uci: move.uci,
        white: move.white,
        draws: move.draws,
        black: move.black,
        total,
        whitePercentage: total > 0 ? (move.white / total) * 100 : 0,
        averageRating: move.averageRating
      };
    }).sort((a, b) => b.total - a.total);
  };

  const yearTemplate = (rowData: OpeningExplorerLichessGame) => {
    return `${rowData.year}/${rowData.month}`;
  };

  const playerNamesTemplate = (rowData: OpeningExplorerLichessGame) => {
    const whiteRating = rowData.white.rating ? ` (${rowData.white.rating})` : '';
    const blackRating = rowData.black.rating ? ` (${rowData.black.rating})` : '';
    return `${rowData.white.name}${whiteRating} vs ${rowData.black.name}${blackRating}`;
  };

  const winnerTemplate = (rowData: OpeningExplorerLichessGame) => {
    if (rowData.winner === 'white') return 'White';
    if (rowData.winner === 'black') return 'Black';
    return 'Draw';
  };

  const speedTemplate = (rowData: OpeningExplorerLichessGame) => {
    return rowData.speed || '-';
  };

  const movePercentageTemplate = (rowData: MoveWithStats) => {
    return formatPercentage(rowData.whitePercentage);
  };

  const moveRatingTemplate = (rowData: MoveWithStats) => {
    return rowData.averageRating ? Math.round(rowData.averageRating) : '-';
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center p-4">
        <ProgressSpinner />
        <span className="ml-2">Loading Lichess data...</span>
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
        <Message severity="info" text="No Lichess data available for this position" />
      </div>
    );
  }

  const stats = calculateStats();
  const moves = formatMoves();

  return (
    <div className="p-3">
      <h3 className="mt-0">Lichess Statistics (1600-2000 rated)</h3>
      
      {data.opening && (
        <Card className="mb-3">
          <div className="grid">
            <div className="col-12">
              <h4 className="mt-0">{data.opening.name}</h4>
              <p className="text-color-secondary mb-0">ECO: {data.opening.eco}</p>
            </div>
          </div>
        </Card>
      )}

      {stats && (
        <Card className="mb-3" title="Overall Statistics">
          <div className="grid">
            <div className="col-12 md:col-2-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-color-secondary">Total Games</div>
              </div>
            </div>
            <div className="col-12 md:col-2-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.whiteWins}</div>
                <div className="text-color-secondary">White ({formatPercentage(stats.whitePercentage)})</div>
              </div>
            </div>
            <div className="col-12 md:col-2-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.draws}</div>
                <div className="text-color-secondary">Draws ({formatPercentage(stats.drawPercentage)})</div>
              </div>
            </div>
            <div className="col-12 md:col-2-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.blackWins}</div>
                <div className="text-color-secondary">Black ({formatPercentage(stats.blackPercentage)})</div>
              </div>
            </div>
            {stats.averageRating && (
              <div className="col-12 md:col-2-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{Math.round(stats.averageRating)}</div>
                  <div className="text-color-secondary">Avg Rating</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {moves.length > 0 && (
        <Card title="Popular Moves" className="mb-3">
          <DataTable 
            value={moves} 
            size="small"
            stripedRows
            className="p-datatable-sm"
          >
            <Column 
              field="san" 
              header="Move" 
              style={{ width: '80px' }}
            />
            <Column 
              field="total" 
              header="Games" 
              style={{ width: '80px' }}
            />
            <Column 
              field="white" 
              header="White" 
              style={{ width: '80px' }}
            />
            <Column 
              field="draws" 
              header="Draws" 
              style={{ width: '80px' }}
            />
            <Column 
              field="black" 
              header="Black" 
              style={{ width: '80px' }}
            />
            <Column 
              header="White %" 
              body={movePercentageTemplate}
              style={{ width: '80px' }}
            />
            <Column 
              header="Avg Rating" 
              body={moveRatingTemplate}
              style={{ width: '90px' }}
            />
          </DataTable>
        </Card>
      )}

      {data.topGames && data.topGames.length > 0 && (
        <Card title="Recent Games">
          <DataTable 
            value={data.topGames} 
            size="small"
            stripedRows
            className="p-datatable-sm"
          >
            <Column 
              header="Date" 
              body={yearTemplate}
              style={{ width: '80px' }}
            />
            <Column 
              header="Speed" 
              body={speedTemplate}
              style={{ width: '80px' }}
            />
            <Column 
              header="Players" 
              body={playerNamesTemplate}
              style={{ minWidth: '300px' }}
            />
            <Column 
              header="Result" 
              body={winnerTemplate}
              style={{ width: '80px' }}
            />
          </DataTable>
        </Card>
      )}
    </div>
  );
}