import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { Accordion, AccordionTab } from "primereact/accordion";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { RepertoireColor, GradualRepertoire } from "../database/types";
import { GradualRepertoireTable } from "./GradualRepertoireTable";
import { CreateRepertoireDialog } from "./CreateRepertoireDialog";
import { ImportRepertoireDialog } from "./ImportRepertoireDialog";
import { ExportWorkspaceDialog } from "./ExportWorkspaceDialog";
import { ImportWorkspaceDialog } from "./ImportWorkspaceDialog";
import { getLevelInformation } from "../analysis/getLevelInformation";
import { LevelProgressBar } from "./LevelProgressBar";

export interface RepertoireSetupResult {
  id: string;
  name: string;
  color: RepertoireColor;
  startingFEN: string;
  startingMoves: string[];
  sourceRepertoireId: string | null;
}

interface RepertoireSetupFormProps {
  onConfirm: (result: RepertoireSetupResult) => void;
}

export const RepertoireSetupForm: React.FC<RepertoireSetupFormProps> = ({
  onConfirm,
}) => {
  const [existingGradualRepertoires, setExistingGradualRepertoires] = useState<
    GradualRepertoire[]
  >([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportWorkspaceDialog, setShowExportWorkspaceDialog] = useState(false);
  const [showImportWorkspaceDialog, setShowImportWorkspaceDialog] = useState(false);
  const menuRef = useRef<Menu>(null);
  const [activeIndex, setActiveIndex] = useState<number[]>([]);
  const initializedRef = useRef(false);

  const STORAGE_KEY = "gradual-repertoire-open-tabs";

  useEffect(() => {
    GradualRepertoireClient.getAll().then(setExistingGradualRepertoires);
  }, []);

  const handleSelectExisting = (repertoire: GradualRepertoire) => {
    onConfirm({
      id: repertoire.id,
      name: repertoire.name,
      color: repertoire.color,
      startingFEN: repertoire.startingFEN,
      startingMoves: repertoire.startingMoves,
      sourceRepertoireId: repertoire.sourceRepertoireId,
    });
  };

  /** Build accordion groups: keyed by "color:move1 move2" */
  function formatTabLabel(color: RepertoireColor, moves: string[]): string {
    const first = moves[0];
    const second = moves[1];
    const movePart = first
      ? second
        ? `1.${first} ${second}`
        : `1.${first}`
      : "(starting position)";
    return `${color.charAt(0).toUpperCase() + color.slice(1)}: ${movePart}`;
  }

  type AccordionGroup = {
    key: string;
    label: string;
    repertoires: GradualRepertoire[];
  };

  const accordionGroups = useMemo(() => {
    const groups: AccordionGroup[] = [];
    const groupMap = new Map<string, AccordionGroup>();

    for (const rep of existingGradualRepertoires) {
      let moves;

      if (rep.color === "white") {
        moves = rep.startingMoves.slice(0, 1);
      } else {
        moves = rep.startingMoves.slice(0, 2);
      }
      const key = `${rep.color}:${moves.join("\0")}`;
      if (!groupMap.has(key)) {
        const group: AccordionGroup = {
          key,
          label: formatTabLabel(rep.color, moves),
          repertoires: [],
        };
        groupMap.set(key, group);
        groups.push(group);
      }
      groupMap.get(key)!.repertoires.push(rep);
    }

    groups.sort((a, b) => {
      const colorOrder = (k: string) => (k.startsWith("white") ? 0 : 1);
      const colorDiff = colorOrder(a.key) - colorOrder(b.key);
      if (colorDiff !== 0) return colorDiff;
      return a.label.localeCompare(b.label);
    });

    return groups;
  }, [existingGradualRepertoires]);

  // Restore open tabs from localStorage once groups are first available
  useEffect(() => {
    if (initializedRef.current || accordionGroups.length === 0) return;
    initializedRef.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const keys: string[] = JSON.parse(stored);
        const indices = accordionGroups
          .map((g, i) => (keys.includes(g.key) ? i : -1))
          .filter((i) => i !== -1);
        setActiveIndex(indices);
      }
    } catch {
      // ignore malformed stored value
    }
  }, [accordionGroups]);

  const handleTabChange = (e: { index: number | number[] }) => {
    const indices = Array.isArray(e.index) ? e.index : [e.index];
    setActiveIndex(indices);
    const keys = indices
      .map((i) => accordionGroups[i]?.key)
      .filter(Boolean) as string[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  };

  const menuItems = [
    {
      label: "Actions",
      items: [
        {
          label: "Create New Repertoire",
          icon: "bi bi-plus-circle",
          command: () => setShowCreateDialog(true),
        },
        {
          label: "Import Repertoire from JSON",
          icon: "bi bi-upload",
          command: () => setShowImportDialog(true),
        },
        {
          label: "Export Workspace",
          icon: "bi bi-box-arrow-up",
          command: () => setShowExportWorkspaceDialog(true),
        },
        {
          label: "Import Workspace",
          icon: "bi bi-box-arrow-in-down",
          command: () => setShowImportWorkspaceDialog(true),
        },
      ],
    },
  ];

  return (
    <div className="p-3">
      {existingGradualRepertoires.length > 0 && (
        <div className="mb-4">
          <h3>Continue Existing Repertoire</h3>
          <Accordion multiple activeIndex={activeIndex} onTabChange={handleTabChange}>
            {accordionGroups.map((group) => (
              <AccordionTab
                key={group.key}
                header={
                  <div className="flex align-items-center gap-3 w-full">
                    <span>{group.label}</span>
                    <div style={{ flex: 1, maxWidth: "200px" }}>
                      <LevelProgressBar
                        levelInformation={getLevelInformation(group.repertoires)}
                      />
                    </div>
                  </div>
                }
              >
                <GradualRepertoireTable
                  repertoires={group.repertoires}
                  onSelect={handleSelectExisting}
                />
              </AccordionTab>
            ))}
          </Accordion>
        </div>
      )}

      <Menu model={menuItems} popup ref={menuRef} id="add-repertoire-menu" />
      <Button
        label="Add Repertoire"
        icon="bi bi-plus"
        onClick={(e) => menuRef.current?.toggle(e)}
        aria-controls="add-repertoire-menu"
        aria-haspopup
      />

      <CreateRepertoireDialog
        visible={showCreateDialog}
        onHide={() => setShowCreateDialog(false)}
        onConfirm={onConfirm}
      />
      <ImportRepertoireDialog
        visible={showImportDialog}
        onHide={() => setShowImportDialog(false)}
        onConfirm={onConfirm}
      />
      <ExportWorkspaceDialog
        visible={showExportWorkspaceDialog}
        onHide={() => setShowExportWorkspaceDialog(false)}
      />
      <ImportWorkspaceDialog
        visible={showImportWorkspaceDialog}
        onHide={() => setShowImportWorkspaceDialog(false)}
      />
    </div>
  );
};
