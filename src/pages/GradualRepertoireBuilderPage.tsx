import React from "react";
import { useParams, useSearchParams } from "react-router";
import { GradualRepertoireBuilder } from "../components/GradualRepertoireBuilder";
import { GRBWorkerProvider } from "../components/GRBWorkerContext";

const GradualRepertoireBuilderPage = () => {
  const { repertoireId } = useParams<{ repertoireId?: string }>();
  const [searchParams] = useSearchParams();
  const movesParam = searchParams.get("moves");
  const initialMoves = movesParam
    ? movesParam.split(",").filter(Boolean)
    : undefined;

  return (
    <GRBWorkerProvider>
      <div className="">
        <GradualRepertoireBuilder
          preselectedRepertoireId={repertoireId}
          initialMoves={initialMoves}
        />
      </div>
    </GRBWorkerProvider>
  );
};

export default GradualRepertoireBuilderPage;
