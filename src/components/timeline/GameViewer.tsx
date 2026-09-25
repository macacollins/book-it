import { SavedGame } from "../../database";

interface GameViewerProps {
  game: SavedGame;
  startingMove: number;
}

export default function ({ game, startingMove }: GameViewerProps) {
  return <pre>{game.pgn}</pre>;
}
