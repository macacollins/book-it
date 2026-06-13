import { create } from "zustand";
import { MoveFrequencyResult } from "../workers/frequencyAnalysisTypes";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";

export interface PositionAnalysisCacheEntry {
  moves: MoveFrequencyResult[];
  coveragePercentage: number;
}

interface SinglePositionBuilderState {
  moves: MoveFrequencyResult[] | null;
  currentFEN: string;
  moveHistory: string[];
  positionAnalysisCache: Record<string, PositionAnalysisCacheEntry>;
  deletePending: { san: string; count: number } | null;
  registeredTableMoveClick: ((move: MoveFrequencyResult) => void) | null;

  setMoves: (moves: MoveFrequencyResult[] | null) => void;
  setCurrentFEN: (fen: string) => void;
  setMoveHistory: (history: string[] | ((prev: string[]) => string[])) => void;
  addToPositionCache: (key: string, entry: PositionAnalysisCacheEntry) => void;
  clearPositionCache: () => void;
  setDeletePending: (pending: { san: string; count: number } | null) => void;
  registerTableMoveClick: (fn: ((move: MoveFrequencyResult) => void) | null) => void;
  triggerDeleteClick: (move: MoveFrequencyResult) => Promise<void>;
}

export const useSinglePositionBuilderStore = create<SinglePositionBuilderState>(
  (set, get) => ({
    moves: null,
    currentFEN: "",
    moveHistory: [],
    positionAnalysisCache: {},
    deletePending: null,
    registeredTableMoveClick: null,

    setMoves: (moves) => set({ moves }),
    setCurrentFEN: (fen) => set({ currentFEN: fen }),
    setMoveHistory: (history) =>
      set((state) => ({
        moveHistory:
          typeof history === "function" ? history(state.moveHistory) : history,
      })),
    addToPositionCache: (key, entry) =>
      set((state) => ({
        positionAnalysisCache: { ...state.positionAnalysisCache, [key]: entry },
      })),
    clearPositionCache: () => set({ positionAnalysisCache: {} }),
    setDeletePending: (pending) => set({ deletePending: pending }),
    registerTableMoveClick: (fn) => set({ registeredTableMoveClick: fn }),
    triggerDeleteClick: async (move) => {
      const { moveHistory } = get();
      const repertoireId =
        useGradualRepertoireBuilderStore.getState().setupResult?.id;
      if (!repertoireId) return;
      const repertoire = await GradualRepertoireClient.getById(repertoireId);
      if (!repertoire) return;
      const prefix = [...moveHistory, move.san];
      const count = repertoire.lines.filter((line) =>
        prefix.every((san, i) => line[i] === san),
      ).length;
      set({ deletePending: { san: move.san, count } });
    },
  }),
);
