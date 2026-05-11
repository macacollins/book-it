import {
  FrequencyWorkerInbound,
  FrequencyWorkerOutbound,
} from "./frequencyAnalysisTypes";
import {
  buildRepertoireFromGradual,
  fetchExplorerData,
  processExplorerResponse,
} from "./frequencyAnalysisCore";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";

const ctx: Worker = self as unknown as Worker;

ctx.onmessage = async (event: MessageEvent<FrequencyWorkerInbound>) => {
  const message = event.data;

  if (message.type === "ANALYZE_FREQUENCY") {
    const { fen, repertoireId, token } = message;

    try {
      const gradualRepertoire =
        await GradualRepertoireClient.getById(repertoireId);
      const repertoire = gradualRepertoire
        ? buildRepertoireFromGradual(
            gradualRepertoire.startingFEN,
            gradualRepertoire.lines,
          )
        : {};

      const explorerData = await fetchExplorerData(fen, token);
      const moves = processExplorerResponse(fen, explorerData, repertoire);
      const totalGames = moves.reduce((sum, move) => sum + move.totalGames, 0);
      const coveredGames = moves
        .filter((move) => move.inRepertoire)
        .reduce((sum, move) => sum + move.totalGames, 0);
      const coveragePercentage =
        totalGames > 0 ? (coveredGames / totalGames) * 100 : 0;

      const response: FrequencyWorkerOutbound = {
        type: "FREQUENCY_ANALYSIS_RESULT",
        fen,
        moves,
        coveragePercentage,
      };

      ctx.postMessage(response);
    } catch (err) {
      const response: FrequencyWorkerOutbound = {
        type: "FREQUENCY_ANALYSIS_ERROR",
        fen,
        error: err instanceof Error ? err.message : String(err),
      };

      ctx.postMessage(response);
    }
  }
};
