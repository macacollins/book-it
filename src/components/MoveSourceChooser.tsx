import React from "react";
import { Button } from "primereact/button";

export type MoveSource = "frequency" | "game";

interface MoveSourceChooserProps {
  onSelect: (source: MoveSource) => void;
}

export const MoveSourceChooser: React.FC<MoveSourceChooserProps> = ({
  onSelect,
}) => {
  return (
    <div className="p-3">
      <h3>Add a New Move</h3>
      <p>How would you like to choose your next move?</p>
      <div className="flex gap-3">
        <Button
          label="From Frequency Analysis"
          icon="bi bi-bar-chart"
          onClick={() => onSelect("frequency")}
        />
        <Button
          label="From Game Analysis"
          icon="bi bi-controller"
          onClick={() => onSelect("game")}
        />
      </div>
    </div>
  );
};
