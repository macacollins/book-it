import { GradualRepertoire } from "../database/types";
import { LevelInformation } from "../types/LevelInformation";

export function getLevelInformation(repertoire: GradualRepertoire | GradualRepertoire[]): LevelInformation {
  const numberMoves = Array.isArray(repertoire)
    ? repertoire.reduce((sum, r) => sum + r.lines.length, 0)
    : repertoire.lines.length;
  const currentLevel = Math.floor(numberMoves / 100) + 1;
  const progressToNextLevel = numberMoves % 100;
  return { numberMoves, currentLevel, progressToNextLevel };
}
