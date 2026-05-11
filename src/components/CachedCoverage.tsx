import React from "react";
import { MoveFrequencyResult } from "../workers/frequencyAnalysisTypes";
import { useCoverageCache } from "./useCoverageCache";

interface CachedCoverageProps {
  row: MoveFrequencyResult;
  /** Pre-computed fallback string from the frequency-analysis cache (e.g. "42.0%") */
  fallbackCoverage?: string;
}

export const CachedCoverage: React.FC<CachedCoverageProps> = ({
  row,
  fallbackCoverage,
}) => {
  const deepCoverage = useCoverageCache(
    (state) => state.coverageCache[row.resultingFen],
  );

  if (deepCoverage !== undefined) {
    return <span>{deepCoverage.coverage.toFixed(1)}%</span>;
  }

  return <span>{fallbackCoverage ?? "-"}</span>;
};
