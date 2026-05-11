import React from "react";
import { ProgressBar } from "primereact/progressbar";
import { LevelInformation } from "../types/LevelInformation";

interface LevelProgressBarProps {
  levelInformation: LevelInformation;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  levelInformation: { currentLevel, progressToNextLevel },
}) => (
  <div className="flex align-items-center gap-2">
    <span className="font-bold">{currentLevel}</span>
    <ProgressBar
      value={progressToNextLevel}
      showValue={false}
      style={{ flex: 1, height: "8px" }}
    />
    <span className="text-color-secondary">{currentLevel + 1}</span>
  </div>
);
