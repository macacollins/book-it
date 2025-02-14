import AnalysisDatabase from "../types/AnalysisDatabase";
import Game from "../types/Game";
import MultipleFENTV from "./MultipleFENTV";

interface MissedMovesTVProps {
  analysisDatabase: AnalysisDatabase;
  games: Game[];
}

export default function MissedMovesTV({
  analysisDatabase,
  games,
}: MissedMovesTVProps) {
  // TODO refactor out
  let filteredGames =
    games && games.filter
      ? games
          .filter((game: Game) => {
            return (
              analysisDatabase[game.url] &&
              analysisDatabase[game.url].youLeftBook
            );
          })
          .map((game: Game) => {
            return analysisDatabase[game.url].displayFEN;
          })
      : [];

  const finalFENs =
    filteredGames.length > 3 ? filteredGames.slice(0, 3) : filteredGames;

  return <MultipleFENTV fens={finalFENs} />;
}
