import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { rankUncoveredPositions } from "./rankUncoveredPositions";
import {
  UncoveredPositionsWorkerInbound,
  UncoveredPositionsWorkerOutbound,
} from "./uncoveredPositionsTypes";

const ctx: Worker = self as unknown as Worker;

ctx.onmessage = async (
  event: MessageEvent<UncoveredPositionsWorkerInbound>,
) => {
  const message = event.data;
  if (message.type !== "RANK_UNCOVERED_POSITIONS") return;

  const { repertoireId, token } = message;

  try {
    const repertoire = await GradualRepertoireClient.getById(repertoireId);
    if (!repertoire) {
      ctx.postMessage({
        type: "UNCOVERED_POSITIONS_ERROR",
        error: "Repertoire not found",
      } as UncoveredPositionsWorkerOutbound);
      return;
    }

    const positions = await rankUncoveredPositions(
      repertoire,
      token,
      (completed, total) => {
        ctx.postMessage({
          type: "UNCOVERED_POSITIONS_PROGRESS",
          completed,
          total,
        } as UncoveredPositionsWorkerOutbound);
      },
    );

    ctx.postMessage({
      type: "UNCOVERED_POSITIONS_RESULT",
      positions,
    } as UncoveredPositionsWorkerOutbound);
  } catch (err) {
    ctx.postMessage({
      type: "UNCOVERED_POSITIONS_ERROR",
      error: err instanceof Error ? err.message : String(err),
    } as UncoveredPositionsWorkerOutbound);
  }
};
