import React, { useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Chess } from "chess.js";
import { MoveFrequencyResult } from "../workers/frequencyAnalysisTypes";
import { CachedCoverage } from "./CachedCoverage";
import { InSourceIndicator } from "./InSourceIndicator";
import {
  useSinglePositionBuilderStore,
  PositionAnalysisCacheEntry,
} from "./useSinglePositionBuilderStore";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";
import { useSourceMovesStore } from "./useSourceMovesStore";

export type { PositionAnalysisCacheEntry };

export const MoveSelectionTable: React.FC = () => {
  const moves = useSinglePositionBuilderStore((s) => s.moves);
  const currentFEN = useSinglePositionBuilderStore((s) => s.currentFEN);
  const moveHistory = useSinglePositionBuilderStore((s) => s.moveHistory);
  const grbLines = useSinglePositionBuilderStore((s) => s.grbLines);
  const positionAnalysisCache = useSinglePositionBuilderStore(
    (s) => s.positionAnalysisCache,
  );
  const setupResult = useGradualRepertoireBuilderStore((s) => s.setupResult);
  const sourceRepertoireId = setupResult?.sourceRepertoireId ?? null;
  const repertoireId = setupResult?.id ?? "";
  const sourceMovesFromFen = useSourceMovesStore((s) => s.sourceMovesFromFen);

  const getPositionCacheKey = (fen: string) => `${repertoireId}:${fen}`;

  // Merge frequency rows with GRB-only and source-only moves that have no Lichess data
  const allRows = useMemo<MoveFrequencyResult[]>(() => {
    const base = moves ?? [];
    if (!currentFEN) return base;

    const existingSans = new Set(base.map((m) => m.san));

    // GRB moves at current position not already in the frequency table
    const grbExtra = new Set<string>();
    if (grbLines) {
      for (const line of grbLines) {
        if (
          line.length > moveHistory.length &&
          moveHistory.every((san, i) => line[i] === san)
        ) {
          const next = line[moveHistory.length];
          if (!existingSans.has(next)) grbExtra.add(next);
        }
      }
    }

    // Source PGN moves at current position not already in the frequency table
    const sourceSans = sourceMovesFromFen[currentFEN] ?? [];
    const sourceExtra = new Set(sourceSans.filter((s) => !existingSans.has(s)));

    const allExtra = new Set([...grbExtra, ...sourceExtra]);
    if (allExtra.size === 0) return base;

    const extraRows: MoveFrequencyResult[] = [];
    for (const san of allExtra) {
      try {
        const chess = new Chess(currentFEN);
        const played = chess.move(san);
        if (!played) continue;
        const uci = played.from + played.to + (played.promotion ?? "");
        extraRows.push({
          san,
          uci,
          resultingFen: chess.fen(),
          totalGames: 0,
          percentage: 0,
          winRate: 0,
          inRepertoire: grbExtra.has(san),
        });
      } catch {
        // skip moves that are illegal in this position
      }
    }

    return [...base, ...extraRows];
  }, [moves, currentFEN, moveHistory, grbLines, sourceMovesFromFen]);

  if (!allRows || allRows.length === 0) return null;

  const percentageTemplate = (row: MoveFrequencyResult) =>
    `${row.percentage.toFixed(1)}%`;

  const winRateTemplate = (row: MoveFrequencyResult) =>
    `${row.winRate.toFixed(1)}%`;

  const inRepertoireTemplate = (row: MoveFrequencyResult) =>
    row.inRepertoire ? "Y" : "N";

  const inSourceTemplate = (row: MoveFrequencyResult) => (
    <InSourceIndicator fen={currentFEN} san={row.san} />
  );

  const deleteTemplate = (row: MoveFrequencyResult) => (
    <Button
      icon="bi bi-trash"
      className="p-button-danger p-button-text p-button-sm"
      onClick={(e) => {
        e.stopPropagation();
        useSinglePositionBuilderStore.getState().triggerDeleteClick(row);
      }}
    />
  );

  return (
    <DataTable
      value={allRows}
      size="small"
      stripedRows
      rowHover
      style={{ cursor: "pointer" }}
      onRowClick={(event) =>
        useSinglePositionBuilderStore
          .getState()
          .registeredTableMoveClick?.(event.data as MoveFrequencyResult)
      }
    >
      <Column field="san" header="Move" />
      <Column header="%" body={percentageTemplate} />
      <Column field="totalGames" header="Games" />
      <Column header="Win Rate" body={winRateTemplate} />
      {/*This one is for the lines in the lines property */}
      <Column header="In GRB" body={inRepertoireTemplate} />
      {/* New one is for lines from the linked source repertoire*/}
      {sourceRepertoireId && (
        <Column header="In Source" body={inSourceTemplate} />
      )}
      <Column
        header="Cov."
        body={(row: MoveFrequencyResult) => {
          const cached = positionAnalysisCache[getPositionCacheKey(row.resultingFen)];
          const fallback = cached
            ? `${cached.coveragePercentage.toFixed(1)}%`
            : undefined;
          return <CachedCoverage row={row} fallbackCoverage={fallback} />;
        }}
      />
      <Column body={deleteTemplate} style={{ width: "3rem" }} />
    </DataTable>
  );
};
