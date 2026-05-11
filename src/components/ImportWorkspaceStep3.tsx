import React from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Button } from "primereact/button";
import { RepertoireImportRow, PGNImportRow } from "../types/importWorkspaceTypes";
import {
  totalGradualRepertoireChanges,
  totalUploadedPGNChanges,
} from "../analysis/getDiffInformation";

interface ImportWorkspaceStep3Props {
  repertoireRows: RepertoireImportRow[];
  pgnRows: PGNImportRow[];
  importing: boolean;
  onImport: () => void;
}

function tabHeader(label: string, count: number) {
  return (
    <span>
      {label}{" "}
      <span className="text-color-secondary font-normal">({count})</span>
    </span>
  );
}

export const ImportWorkspaceStep3: React.FC<ImportWorkspaceStep3Props> = ({
  repertoireRows,
  pgnRows,
  importing,
  onImport,
}) => {
  const activeRepRows = repertoireRows.filter((r) => r.shouldImport);
  const activePGNRows = pgnRows.filter((r) => r.shouldImport);

  const newReps = activeRepRows.filter((r) => !r.shouldMerge);
  const updatedReps = activeRepRows.filter(
    (r) => r.shouldMerge && r.diff && totalGradualRepertoireChanges(r.diff) > 0,
  );
  const unchangedReps = activeRepRows.filter(
    (r) =>
      r.shouldMerge && r.diff && totalGradualRepertoireChanges(r.diff) === 0,
  );

  const newPGNs = activePGNRows.filter((r) => !r.shouldMerge);
  const updatedPGNs = activePGNRows.filter(
    (r) => r.shouldMerge && r.diff && totalUploadedPGNChanges(r.diff) > 0,
  );
  const unchangedPGNs = activePGNRows.filter(
    (r) => r.shouldMerge && r.diff && totalUploadedPGNChanges(r.diff) === 0,
  );

  const repList = (rows: RepertoireImportRow[]) =>
    rows.length === 0 ? (
      <p className="m-0 text-color-secondary">None</p>
    ) : (
      <ul className="m-0 pl-3">
        {rows.map((r) => (
          <li key={r.incoming.id}>
            {r.incoming.name}
            {r.diff && totalGradualRepertoireChanges(r.diff) > 0 && (
              <span className="ml-2 text-color-secondary text-sm">
                ({totalGradualRepertoireChanges(r.diff)} change
                {totalGradualRepertoireChanges(r.diff) !== 1 ? "s" : ""})
              </span>
            )}
          </li>
        ))}
      </ul>
    );

  const pgnList = (rows: PGNImportRow[]) =>
    rows.length === 0 ? (
      <p className="m-0 text-color-secondary">None</p>
    ) : (
      <ul className="m-0 pl-3">
        {rows.map((r) => (
          <li key={r.incoming.id}>
            {r.incoming.filename}
            {r.diff && totalUploadedPGNChanges(r.diff) > 0 && (
              <span className="ml-2 text-color-secondary text-sm">
                ({totalUploadedPGNChanges(r.diff)} change
                {totalUploadedPGNChanges(r.diff) !== 1 ? "s" : ""})
              </span>
            )}
          </li>
        ))}
      </ul>
    );

  return (
    <div className="flex flex-column gap-3">
      <Accordion multiple>
        <AccordionTab header={tabHeader("New Repertoires", newReps.length)}>
          {repList(newReps)}
        </AccordionTab>
        <AccordionTab
          header={tabHeader("Updated Repertoires", updatedReps.length)}
        >
          {repList(updatedReps)}
        </AccordionTab>
        <AccordionTab
          header={tabHeader("Unchanged Repertoires", unchangedReps.length)}
        >
          {repList(unchangedReps)}
        </AccordionTab>
        <AccordionTab header={tabHeader("New PGN Files", newPGNs.length)}>
          {pgnList(newPGNs)}
        </AccordionTab>
        <AccordionTab header={tabHeader("Updated PGN Files", updatedPGNs.length)}>
          {pgnList(updatedPGNs)}
        </AccordionTab>
        <AccordionTab
          header={tabHeader("Unchanged PGN Files", unchangedPGNs.length)}
        >
          {pgnList(unchangedPGNs)}
        </AccordionTab>
      </Accordion>

      <div className="flex justify-content-end">
        <Button
          label={importing ? "Importing..." : "Import"}
          icon="bi bi-box-arrow-in-down"
          onClick={onImport}
          loading={importing}
          disabled={importing}
        />
      </div>
    </div>
  );
};
