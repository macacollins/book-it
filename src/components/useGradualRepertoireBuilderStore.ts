import { create } from "zustand";
import { RepertoireSetupResult } from "./RepertoireSetupForm";
import { MoveSource } from "./MoveSourceChooser";

interface GradualRepertoireBuilderState {
  setupResult: RepertoireSetupResult | null;
  moveSource: MoveSource;
  token: string | null;
  initialMoves: string[] | undefined;
  setSetupResult: (result: RepertoireSetupResult | null) => void;
  setMoveSource: (source: MoveSource) => void;
  setToken: (token: string | null) => void;
  setInitialMoves: (moves: string[] | undefined) => void;
}

export const useGradualRepertoireBuilderStore =
  create<GradualRepertoireBuilderState>((set) => ({
    setupResult: null,
    moveSource: "frequency",
    token: localStorage.getItem("lichessToken"),
    initialMoves: undefined,
    setSetupResult: (result) => set({ setupResult: result }),
    setMoveSource: (source) => set({ moveSource: source }),
    setToken: (token) => set({ token }),
    setInitialMoves: (moves) => set({ initialMoves: moves }),
  }));
