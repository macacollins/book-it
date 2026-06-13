import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { FrequencyWorkerOutbound } from "../workers/frequencyAnalysisTypes";
import { CoverageWorkerOutbound } from "../workers/coverageAnalysisTypes";
import {
  UncoveredPosition,
  UncoveredPositionsWorkerOutbound,
} from "../workers/uncoveredPositionsTypes";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";
import { useSinglePositionBuilderStore } from "./useSinglePositionBuilderStore";
import { useCoverageCache } from "./useCoverageCache";
import { useSourceMovesStore } from "./useSourceMovesStore";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";

interface GRBWorkerContextValue {
  requestFrequencyAnalysis: (fen: string) => void;
  requestCoverageAnalysis: () => void;
  requestUncoveredPositions: () => void;
  coverageProgress: { completed: number; total: number } | null;
  uncoveredPositions: UncoveredPosition[];
  loading: boolean;
  analyzing: boolean;
  error: string | null;
  coveragePercentage: number;
  coverageCompletionNumber: number;
}

const GRBWorkerContext = createContext<GRBWorkerContextValue>({
  requestFrequencyAnalysis: () => {},
  requestCoverageAnalysis: () => {},
  requestUncoveredPositions: () => {},
  coverageProgress: null,
  uncoveredPositions: [],
  loading: true,
  analyzing: true,
  error: null,
  coveragePercentage: 0,
  coverageCompletionNumber: 0
});

export const useGRBWorkers = () => useContext(GRBWorkerContext);

export const GRBWorkerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setupResult = useGradualRepertoireBuilderStore((s) => s.setupResult);
  const repertoireId = setupResult?.id ?? "";

  const frequencyWorkerRef = useRef<Worker | null>(null);
  const coverageWorkerRef = useRef<Worker | null>(null);
  const uncoveredWorkerRef = useRef<Worker | null>(null);
  const seqRef = useRef(0);
  const coverageRunningRef = useRef(false);

  const [coverageProgress, setCoverageProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [uncoveredPositions, setUncoveredPositions] = useState<
    UncoveredPosition[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(true);
  const [completionNumber, setCoverageCompletionNumber] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [coveragePercentage, setCoveragePercentage] = useState(0);

  // Stable refs so onmessage closures can call these without capturing stale values
  const requestCoverageAnalysisRef = useRef<() => void>(() => {});
  const requestUncoveredPositionsRef = useRef<() => void>(() => {});

  const requestCoverageAnalysis = useCallback(() => {
    const worker = coverageWorkerRef.current;
    if (!worker) return;

    setCoverageProgress({ completed: 0, total: 0 });
    coverageRunningRef.current = true;

    const { setupResult: sr, token: tok } =
      useGradualRepertoireBuilderStore.getState();
    const currentRepertoireId = sr?.id ?? "";
    const currentToken = tok ?? "";
    const currentColor = sr?.color ?? "white";

    worker.postMessage({
      type: "ANALYZE_COVERAGE",
      repertoireId: currentRepertoireId,
      token: currentToken,
      color: currentColor,
    });
  }, []);

  const requestUncoveredPositions = useCallback(() => {
    const worker = uncoveredWorkerRef.current;
    if (!worker) return;

    const { setupResult: sr, token: tok } =
      useGradualRepertoireBuilderStore.getState();
    const currentRepertoireId = sr?.id ?? "";
    const currentToken = tok ?? "";

    worker.postMessage({
      type: "RANK_UNCOVERED_POSITIONS",
      repertoireId: currentRepertoireId,
      token: currentToken,
    });
  }, []);

  // Keep stable refs in sync with the latest callbacks
  useEffect(() => {
    requestCoverageAnalysisRef.current = requestCoverageAnalysis;
    requestUncoveredPositionsRef.current = requestUncoveredPositions;
  }, [requestCoverageAnalysis, requestUncoveredPositions]);

  // Create / recreate all persistent workers when the repertoire changes
  useEffect(() => {
    // Reset derived state for the new repertoire
    setCoverageProgress(null);
    setUncoveredPositions([]);
    setCoveragePercentage(0);
    setAnalyzing(true);
    setError(null);
    seqRef.current = 0;
    coverageRunningRef.current = false;

    if (!repertoireId) {
      frequencyWorkerRef.current?.terminate();
      frequencyWorkerRef.current = null;
      coverageWorkerRef.current?.terminate();
      coverageWorkerRef.current = null;
      uncoveredWorkerRef.current?.terminate();
      uncoveredWorkerRef.current = null;
      return;
    }

    const { setupResult: sr } = useGradualRepertoireBuilderStore.getState();
    const currentRepertoireId = sr?.id ?? "";
    const currentStartingFEN = sr?.startingFEN ?? "";

    // --- Frequency worker ---
    const freqWorker = new Worker(
      new URL("../workers/FrequencyAnalysisWorker.ts", import.meta.url),
      { type: "module" },
    );
    frequencyWorkerRef.current = freqWorker;

    freqWorker.onmessage = (event: MessageEvent<FrequencyWorkerOutbound>) => {
      const msg = event.data;

      // Discard stale responses from superseded requests
      if (msg.requestId !== seqRef.current) return;

      if (msg.type === "FREQUENCY_ANALYSIS_RESULT") {
        const cacheKey = `${currentRepertoireId}:${msg.fen}`;

        const store = useSinglePositionBuilderStore.getState();
        store.setMoves(msg.moves);
        store.addToPositionCache(cacheKey, {
          moves: msg.moves,
          coveragePercentage: msg.coveragePercentage,
        });

        setCoveragePercentage(msg.coveragePercentage);
        setLoading(false);
        setError(null);

        // Kick off coverage + uncovered analyses if coverage isn't already running
        if (!coverageRunningRef.current) {
          requestCoverageAnalysisRef.current();
          requestUncoveredPositionsRef.current();
        }
      } else if (msg.type === "FREQUENCY_ANALYSIS_ERROR") {
        setError(msg.error);
        setLoading(false);
      }
    };

    // --- Coverage worker ---
    const covWorker = new Worker(
      new URL("../workers/CoverageAnalysisWorker.ts", import.meta.url),
      { type: "module" },
    );
    coverageWorkerRef.current = covWorker;

    covWorker.onmessage = (event: MessageEvent<CoverageWorkerOutbound>) => {
      const msg = event.data;
      if (msg.type === "COVERAGE_PROGRESS") {
        setCoverageProgress({ completed: msg.completed, total: msg.total });
      } else if (msg.type === "COVERAGE_POSITION_RESULT") {
        useCoverageCache.getState().addPosition(msg.fen, {
          coverage: msg.coverage,
          totalGames: msg.totalGames,
          movePath: msg.movePath,
        });
        if (msg.fen === currentStartingFEN) {
          GradualRepertoireClient.updateCachedCoveragePercent(
            currentRepertoireId,
            msg.coverage,
          );
        }
      } else if (msg.type === "SOURCE_REPERTOIRE_LOADED") {
        useSourceMovesStore.getState().setSourceMoves(msg.sourceMovesFromFen);
      } else if (msg.type === "COVERAGE_COMPLETE") {
        setCoverageProgress(null);
        coverageRunningRef.current = false;
        setAnalyzing(false);
      } else if (msg.type === "COVERAGE_ERROR") {
        console.error("Coverage analysis error:", msg.error);
        setCoverageProgress(null);
        coverageRunningRef.current = false;
      }
    };

    // --- Uncovered positions worker ---
    const uncovWorker = new Worker(
      new URL("../workers/UncoveredPositionsWorker.ts", import.meta.url),
      { type: "module" },
    );
    uncoveredWorkerRef.current = uncovWorker;

    uncovWorker.onmessage = (
      event: MessageEvent<UncoveredPositionsWorkerOutbound>,
    ) => {
      const msg = event.data;
      if (msg.type === "UNCOVERED_POSITIONS_RESULT") {
        setUncoveredPositions(msg.positions);
      } else if (msg.type === "UNCOVERED_POSITIONS_ERROR") {
        console.error("Uncovered positions analysis error:", msg.error);
      }
    };

    // Cleanup: terminate all workers when repertoireId changes or provider unmounts
    return () => {
      freqWorker.terminate();
      frequencyWorkerRef.current = null;
      covWorker.terminate();
      coverageWorkerRef.current = null;
      uncovWorker.terminate();
      uncoveredWorkerRef.current = null;
    };
  }, [repertoireId]);

  const requestFrequencyAnalysis = useCallback((fen: string) => {
    const worker = frequencyWorkerRef.current;
    if (!worker) return;

    const { setupResult: sr, token } =
      useGradualRepertoireBuilderStore.getState();
    const currentRepertoireId = sr?.id ?? "";
    const cacheKey = `${currentRepertoireId}:${fen}`;
    const cachedPosition =
      useSinglePositionBuilderStore.getState().positionAnalysisCache[cacheKey];

    if (cachedPosition) {
      useSinglePositionBuilderStore.getState().setMoves(cachedPosition.moves);
      setCoveragePercentage(cachedPosition.coveragePercentage);
      setLoading(false);
      setAnalyzing(false);
      setCoverageCompletionNumber(current => current + 1);
      setError(null);
    } else {
      setAnalyzing(true);
      setError(null);
    }

    seqRef.current += 1;
    worker.postMessage({
      type: "ANALYZE_FREQUENCY",
      fen,
      repertoireId: currentRepertoireId,
      token,
      requestId: seqRef.current,
    });
  }, []);

  return (
    <GRBWorkerContext.Provider
      value={{
        requestFrequencyAnalysis,
        requestCoverageAnalysis,
        requestUncoveredPositions,
        coverageProgress,
        uncoveredPositions,
        loading,
        analyzing,
        error,
        coveragePercentage,
        coverageCompletionNumber: completionNumber,
      }}
    >
      {children}
    </GRBWorkerContext.Provider>
  );
};
