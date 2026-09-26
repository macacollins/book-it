import { SavedGameClient } from "../database/SavedGameClient";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { PositionUpdateTaskClient } from "../database/PositionUpdateTaskClient";
import { matchGameToGRB } from "../analysis/matchGameToGRB";
import {
  buildRepertoireFromGradual,
  fetchExplorerData,
  processExplorerResponse,
} from "./frequencyAnalysisCore";
import {
  GameTaskTrackingWorkerInbound,
  GameTaskTrackingWorkerOutbound,
} from "./gameTaskTrackingTypes";

const ctx: Worker = self as unknown as Worker;

async function computeCoverage(
  latestFEN: string,
  grbId: string,
  token: string,
): Promise<number> {
  const grb = await GradualRepertoireClient.getById(grbId);
  if (!grb) return 0;

  const repertoire = buildRepertoireFromGradual(grb.startingFEN, grb.lines);
  const explorerData = await fetchExplorerData(latestFEN, token);
  const moves = processExplorerResponse(latestFEN, explorerData, repertoire);

  const totalGames = moves.reduce((sum, m) => sum + m.totalGames, 0);
  const coveredGames = moves
    .filter((m) => m.inRepertoire)
    .reduce((sum, m) => sum + m.totalGames, 0);

  return totalGames > 0 ? Math.round((coveredGames / totalGames) * 100) : 0;
}

ctx.onmessage = async (event: MessageEvent<GameTaskTrackingWorkerInbound>) => {
  const message = event.data;
  if (message.type !== "START_GAME_TASK_TRACKING") return;

  const { usernames, token } = message;

  try {
    const [allGames, allGRBs] = await Promise.all([
      SavedGameClient.getAll(),
      GradualRepertoireClient.getAll(),
    ]);

    const recentGames = allGames
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    const totalGames = recentGames.length;

    for (let i = 0; i < recentGames.length; i++) {
      const game = recentGames[i];

      ctx.postMessage({
        type: "GAME_TASK_PROGRESS",
        processedGames: i,
        totalGames,
        currentGameId: game.id,
      } satisfies GameTaskTrackingWorkerOutbound);

      const match = matchGameToGRB(game, allGRBs, usernames);
      if (!match) continue;

      const existingTasks = await PositionUpdateTaskClient.getByGameId(game.id);
      let task = existingTasks.length > 0 ? existingTasks[0] : null;

      if (!task) {
        const newTask = {
          id: crypto.randomUUID(),
          gameId: game.id,
          grbId: "3", //match.matchedGRB.id,
          latestFEN: match.afterFEN,
          coverage: null,
          completionStatus: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await PositionUpdateTaskClient.insert(newTask);
        task = newTask;
      }

      if (task.completionStatus) continue;

      const coverage = await computeCoverage(task.latestFEN, task.grbId, token);

      if (coverage >= 90) {
        await PositionUpdateTaskClient.markComplete(task.id);
      } else {
        await PositionUpdateTaskClient.updateCoverage(task.id, coverage);
      }
    }

    ctx.postMessage({
      type: "GAME_TASK_COMPLETE",
    } satisfies GameTaskTrackingWorkerOutbound);
  } catch (err) {
    ctx.postMessage({
      type: "GAME_TASK_ERROR",
      error: err instanceof Error ? err.message : String(err),
    } satisfies GameTaskTrackingWorkerOutbound);
  }
};
