import { create } from "zustand";
import { GRBMatchResult } from "../../analysis/matchGameToGRB";
import { GRBGameRow } from "../../workers/grbDiffTypes";

interface TimelineStoreState {
  gameMatchResultCache: Record<string, GRBGameRow>;
  addToGameCache: (entry: GRBGameRow) => void;
  addToGameCacheMultiple: (entries: GRBGameRow[]) => void;
  clearGameCache: () => void;
}

const debugging = true;

export const useTimelineStore = create<TimelineStoreState>((set, get) => ({
  gameMatchResultCache: {},
  addToGameCache: (entry) => {
    if (debugging) {
      console.log("Adding position cache set to ", entry.gameId, entry);
    }
    set((state) => ({
      gameMatchResultCache: {
        ...state.gameMatchResultCache,
        [entry.gameId]: entry,
      },
    }));
  },
  addToGameCacheMultiple: (entries) => {
    if (debugging) {
      console.log("Adding position cache set to ", entries);
    }

    let newObject: Record<string, GRBGameRow> = {};
    for (let entry of entries) {
      newObject[entry.gameId] = entry;
    }

    set((state) => ({
      gameMatchResultCache: { ...state.gameMatchResultCache, ...newObject },
    }));
  },
  clearGameCache: () => {
    if (debugging) {
      console.log("Clearing position cache.");
    }
    set({ gameMatchResultCache: {} });
  },
}));
