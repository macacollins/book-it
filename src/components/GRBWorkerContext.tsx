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
    if (coverageWorkerRef.current) {
      coverageWorkerRef.current.terminate();
    }
    setCoverageProgress({ completed: 0, total: 0 });

    // Read latest values at call time — avoids stale closure issues
    const { setupResult: sr, token: tok } =
      useGradualRepertoireBuilderStore.getState();
    const currentRepertoireId = sr?.id ?? "";
    const currentToken = tok ?? "";
    const currentColor = sr?.color ?? "white";
    const currentStartingFEN = sr?.startingFEN ?? "";

    const worker = new Worker(
      new URL("../workers/CoverageAnalysisWorker.ts", import.meta.url),
      { type: "module" },
    );
    coverageWorkerRef.current = worker;

    worker.onmessage = (event: MessageEvent<CoverageWorkerOutbound>) => {
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
        coverageWorkerRef.current = null;
        setAnalyzing(false);
      } else if (msg.type === "COVERAGE_ERROR") {
        console.error("Coverage analysis error:", msg.error);
        setCoverageProgress(null);
        coverageWorkerRef.current = null;
      }
    };

    worker.postMessage({
      type: "ANALYZE_COVERAGE",
      repertoireId: currentRepertoireId,
      token: currentToken,
      color: currentColor,
    });
  }, []);

  const requestUncoveredPositions = useCallback(() => {
    if (uncoveredWorkerRef.current) {
      uncoveredWorkerRef.current.terminate();
    }

    const { setupResult: sr, token: tok } =
      useGradualRepertoireBuilderStore.getState();
    const currentRepertoireId = sr?.id ?? "";
    const currentToken = tok ?? "";

    const worker = new Worker(
      new URL("../workers/UncoveredPositionsWorker.ts", import.meta.url),
      { type: "module" },
    );
    uncoveredWorkerRef.current = worker;

    worker.onmessage = (
      event: MessageEvent<UncoveredPositionsWorkerOutbound>,
    ) => {
      const msg = event.data;
      if (msg.type === "UNCOVERED_POSITIONS_RESULT") {
        setUncoveredPositions(msg.positions);
        uncoveredWorkerRef.current = null;
      } else if (msg.type === "UNCOVERED_POSITIONS_ERROR") {
        console.error("Uncovered positions analysis error:", msg.error);
        uncoveredWorkerRef.current = null;
      }
    };

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

  // Create / recreate the persistent FrequencyAnalysisWorker when the repertoire changes
  useEffect(() => {
    // Reset derived state for the new repertoire
    setCoverageProgress(null);
    setUncoveredPositions([]);
    setCoveragePercentage(0);
    setAnalyzing(true);
    
    setError(null);
    seqRef.current = 0;

    // Tear down coverage / uncovered workers from the previous repertoire
    if (coverageWorkerRef.current) {
      coverageWorkerRef.current.terminate();
      coverageWorkerRef.current = null;
    }
    if (uncoveredWorkerRef.current) {
      uncoveredWorkerRef.current.terminate();
      uncoveredWorkerRef.current = null;
    }

    if (!repertoireId) {
      frequencyWorkerRef.current?.terminate();
      frequencyWorkerRef.current = null;
      return;
    }

    const worker = new Worker(
      new URL("../workers/FrequencyAnalysisWorker.ts", import.meta.url),
      { type: "module" },
    );
    frequencyWorkerRef.current = worker;

    worker.onmessage = (event: MessageEvent<FrequencyWorkerOutbound>) => {
      const msg = event.data;

      // Discard stale responses from superseded requests
      if (msg.requestId !== seqRef.current) return;

      if (msg.type === "FREQUENCY_ANALYSIS_RESULT") {
        const { setupResult: sr } =
          useGradualRepertoireBuilderStore.getState();
        const currentRepertoireId = sr?.id ?? "";
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
        // setAnalyzing(false);

        // Kick off coverage + uncovered analyses if coverage isn't already running
        if (!coverageWorkerRef.current) {
          requestCoverageAnalysisRef.current();
          requestUncoveredPositionsRef.current();
        }
      } else if (msg.type === "FREQUENCY_ANALYSIS_ERROR") {
        setError(msg.error);
        setLoading(false);
        // setAnalyzing(false);
      }
    };

    // Cleanup: terminate the frequency worker when repertoireId changes or provider unmounts
    return () => {
      worker.terminate();
      frequencyWorkerRef.current = null;
    };
  }, [repertoireId]);

  // Terminate coverage / uncovered workers on provider unmount
  useEffect(() => {
    return () => {
      coverageWorkerRef.current?.terminate();
      uncoveredWorkerRef.current?.terminate();
    };
  }, []);

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
