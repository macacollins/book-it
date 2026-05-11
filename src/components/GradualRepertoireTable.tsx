import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { GradualRepertoire } from "../database/types";
import { TinyFENDisplay } from "../pages/TinyFENDisplay";
import { getLevelInformation } from "../analysis/getLevelInformation";
import { LevelProgressBar } from "./LevelProgressBar";
import { CoverageProgressBar } from "./CoverageProgressBar";

interface GradualRepertoireTableProps {
  repertoires: GradualRepertoire[];
  onSelect: (rep: GradualRepertoire) => void;
}

export const GradualRepertoireTable: React.FC<GradualRepertoireTableProps> = ({
  repertoires,
  onSelect,
}) => (
  <DataTable
    value={[...repertoires].sort((a, b) => a.lines.length - b.lines.length)}
    size="small"
    stripedRows
    rowHover
    style={{ cursor: "pointer" }}
    onRowClick={(e) => onSelect(e.data as GradualRepertoire)}
  >
    {/* <Column
      header="Board"
      body={(rep: GradualRepertoire) => (
        <TinyFENDisplay
          fen={rep.startingFEN}
          invert={rep.color === "black"}
        />
      )}
      style={{ width: "190px" }}
    /> */}
    <Column field="name" header="Name" />
    <Column
      header="Level"
      body={(rep: GradualRepertoire) => (
        <LevelProgressBar levelInformation={getLevelInformation(rep)} />
      )}
    />
    <Column
      header="Coverage"
      body={(rep: GradualRepertoire) => (
        <CoverageProgressBar coverage={rep.cachedCoveragePercent} />
      )}
    />
    <Column
      header="Coverage Depth"
      body={(rep: GradualRepertoire) => (
        Math.floor(rep.coverageDepthPlies / 2)
      )}
    />
    {/* <Column
      header="Lines"
      body={(rep: GradualRepertoire) => rep.lines.length}
      style={{ width: "70px" }}
    /> */}

  </DataTable>
);
