import { create } from "zustand";

export interface CoveragePositionData {
  coverage: number;
  totalGames: number;
  movePath: string[];
}

interface CoverageCacheState {
  coverageCache: Record<string, CoveragePositionData>;
  addPosition: (fen: string, data: CoveragePositionData) => void;
  clearCache: () => void;
}

export const useCoverageCache = create<CoverageCacheState>((set) => ({
  coverageCache: {},
  addPosition: (fen, data) =>
    set((state) => ({
      coverageCache: { ...state.coverageCache, [fen]: data },
    })),
  clearCache: () => set({ coverageCache: {} }),
}));
