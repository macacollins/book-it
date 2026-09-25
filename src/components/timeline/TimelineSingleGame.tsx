import type { GameResult } from "./generateTimelineData";

export interface TimelineSingleGameProps {
  game: GameResult;
}

export default function ({ game }: TimelineSingleGameProps) {
  return (
    <div key={game.gameID + "-singlegame"} className="cc-single-game-result">
      {game.gameID}
    </div>
  );
}
