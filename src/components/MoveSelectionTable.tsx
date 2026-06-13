import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { MoveFrequencyResult } from "../workers/frequencyAnalysisTypes";
import { CachedCoverage } from "./CachedCoverage";
import { InSourceIndicator } from "./InSourceIndicator";
import {
  useSinglePositionBuilderStore,
  PositionAnalysisCacheEntry,
} from "./useSinglePositionBuilderStore";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";

export type { PositionAnalysisCacheEntry };

export const MoveSelectionTable: React.FC = () => {
  const moves = useSinglePositionBuilderStore((s) => s.moves);
  const currentFEN = useSinglePositionBuilderStore((s) => s.currentFEN);
  const positionAnalysisCache = useSinglePositionBuilderStore(
    (s) => s.positionAnalysisCache,
  );
  const setupResult = useGradualRepertoireBuilderStore((s) => s.setupResult);
  const sourceRepertoireId = setupResult?.sourceRepertoireId ?? null;
  const repertoireId = setupResult?.id ?? "";

  const getPositionCacheKey = (fen: string) => `${repertoireId}:${fen}`;

  if (!moves || moves.length === 0) return null;

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
      value={moves}
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
