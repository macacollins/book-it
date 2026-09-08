import { create } from "zustand";
import { MoveFrequencyResult } from "../workers/frequencyAnalysisTypes";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";
import { GameMatch } from "../analysis/crossReferenceGames";

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
  grbLines: string[][] | null;
  gameMatches: Record<string, GameMatch[]>;

  setMoves: (moves: MoveFrequencyResult[] | null) => void;
  setCurrentFEN: (fen: string) => void;
  setMoveHistory: (history: string[] | ((prev: string[]) => string[])) => void;
  addToPositionCache: (key: string, entry: PositionAnalysisCacheEntry) => void;
  clearPositionCache: () => void;
  setDeletePending: (pending: { san: string; count: number } | null) => void;
  registerTableMoveClick: (fn: ((move: MoveFrequencyResult) => void) | null) => void;
  triggerDeleteClick: (move: MoveFrequencyResult) => Promise<void>;
  setGrbLines: (lines: string[][] | null) => void;
  setGameMatches: (matches: GameMatch[]) => void;
}

const debugging = true;

export const useSinglePositionBuilderStore = create<SinglePositionBuilderState>(
  (set, get) => ({
    moves: null,
    currentFEN: "",
    moveHistory: [],
    positionAnalysisCache: {},
    deletePending: null,
    registeredTableMoveClick: null,
    grbLines: null,
    gameMatches: {},

    setMoves: (moves) => {
      if (debugging) {
        console.log("Moves set to ", moves)
      }
      set({ moves })
    },
    setCurrentFEN: (fen) => {
      if (debugging) {
        console.log("FEN set to ", fen)
      }
      set({ currentFEN: fen })
    },
    setMoveHistory: (history) => {
      if (debugging) {
        console.log("Move history set to ", history)
      }
      set((state) => ({
        moveHistory:
          typeof history === "function" ? history(state.moveHistory) : history,
      }))
    },
    addToPositionCache: (key, entry) => {
      if (debugging) {
        console.log("adding position cache set to ", key, entry)
      }
      set((state) => ({
        positionAnalysisCache: { ...state.positionAnalysisCache, [key]: entry },
      })) 
    },
    clearPositionCache: () => {
      if (debugging) {
        console.log("Clearing position cache.")
      }
      set({ positionAnalysisCache: {} })
    },
    setDeletePending: (pending) => {
      
      if (debugging) {
        console.log("Delete pending set to ", pending);
      }
      set({ deletePending: pending })
    },
    registerTableMoveClick: (fn) => {
      set({ registeredTableMoveClick: fn })
    },
    setGrbLines: (lines) => set({ grbLines: lines }),
    setGameMatches: (gameMatches) => {
      
      if (gameMatches) {
        const firstGame = gameMatches[0];
        if (firstGame) {
          
          const id = firstGame.gradualRepertoire.id;
          const partial = {
            [id]: gameMatches
          }
          console.log("Updating to ", partial);
          set(state => ({ gameMatches: {
            ...state.gameMatches,
            ...partial
          }}));
        } else {
          console.log("First game was falsy");
        }
      }
    },
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
