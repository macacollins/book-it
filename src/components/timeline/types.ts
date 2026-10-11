import { SavedGame } from "../../database";

export interface TimelineDay {
  name: string;
  results: SavedGame[];
}

export interface PerOpeningViewModel {
  name: string;
  win: number;
  loss: number;
  draw: number;
  userDiverged: number;
  opponentDiverged: number;
  totalXP: number;
  color: "white" | "black";
}
