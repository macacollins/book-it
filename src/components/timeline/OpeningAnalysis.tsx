import { useEffect, useState } from "react";
import { GameAnalysis, GameAnalysisClient } from "../../database";
import { PerOpeningViewModel } from "./types";
import GameAnalysisRow from "./GameAnalysisRow";

export default function () {
  const [currentAnalysis, setCurrentAnalysis] = useState<GameAnalysis[]>([]);

  const [viewModel, setViewModel] = useState<PerOpeningViewModel[]>([]);

  async function updateAnalysis() {
    const dbAnalysis = await GameAnalysisClient.getAll();

    setCurrentAnalysis(dbAnalysis);

    const newItems: Record<string, PerOpeningViewModel> = {};
    dbAnalysis.forEach((analysisItem: GameAnalysis) => {
      const key = analysisItem.analysisData.matchedGRBName;
      const existingItem = newItems[key];

      const result = analysisItem.analysisData.userWon;

      if (existingItem) {
        const { win, loss, draw, totalXP, userDiverged, opponentDiverged } =
          existingItem;
        newItems[key] = {
          name: key,
          win: result === "yes" ? win + 1 : win,
          loss: result === "no" ? loss + 1 : loss,
          draw: result === "draw" ? draw + 1 : draw,
          userDiverged: analysisItem.analysisData.userDiverged
            ? userDiverged + 1
            : userDiverged + 0,
          opponentDiverged: analysisItem.analysisData.userDiverged
            ? opponentDiverged + 0
            : opponentDiverged + 1,
          totalXP: totalXP + 1,
        };
      } else {
        const newViewModel: PerOpeningViewModel = {
          name: key,
          win: result === "yes" ? 1 : 0,
          loss: result === "no" ? 1 : 0,
          draw: result === "draw" ? 1 : 0,
          userDiverged: analysisItem.analysisData.userDiverged ? 1 : 0,
          opponentDiverged: analysisItem.analysisData.userDiverged ? 0 : 1,
          totalXP: 1,
        };

        newItems[key] = newViewModel;
      }

      const condensed: PerOpeningViewModel[] = Object.values(newItems);

      condensed.sort((a, b) => {
        return a.totalXP > b.totalXP ? -1 : 1;
      });

      setViewModel(condensed);
    });
  }

  useEffect(() => {
    updateAnalysis();
  }, []);

  return (
    <>
      {currentAnalysis?.length} Items Analyzed
      {viewModel.map((model) => {
        return (
          <>
            <GameAnalysisRow viewModel={model} />
          </>
        );
      })}
    </>
  );
}
