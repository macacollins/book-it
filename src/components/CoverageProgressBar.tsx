import React from "react";
import { ProgressBar } from "primereact/progressbar";

interface CoverageProgressBarProps {
  coverage: number | null;
}

export const CoverageProgressBar: React.FC<CoverageProgressBarProps> = ({
  coverage,
}) => {
  if (coverage === null) {
    return <span className="text-xs text-color-secondary">—</span>;
  }

  const rounded = Math.round(coverage);

  return (
    <div className="flex align-items-center gap-2" style={{ minWidth: "100px" }}>
      <ProgressBar
        value={rounded}
        style={{ height: "6px", flex: 1 }}
        showValue={false}
      />
      <span className="text-xs" style={{ whiteSpace: "nowrap" }}>
        {rounded}%
      </span>
    </div>
  );
};
