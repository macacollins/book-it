import { create } from "zustand";

interface SourceMovesState {
  sourceMovesFromFen: Record<string, string[]>;
  setSourceMoves: (map: Record<string, string[]>) => void;
  clearSourceMoves: () => void;
}

export const useSourceMovesStore = create<SourceMovesState>((set) => ({
  sourceMovesFromFen: {},
  setSourceMoves: (map) => set({ sourceMovesFromFen: map }),
  clearSourceMoves: () => set({ sourceMovesFromFen: {} }),
}));
