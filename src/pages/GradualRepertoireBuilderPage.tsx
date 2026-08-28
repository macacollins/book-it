import React from "react";
import { useParams, useSearchParams } from "react-router";
import { GradualRepertoireBuilder } from "../components/GradualRepertoireBuilder";

const GradualRepertoireBuilderPage = () => {
  const { repertoireId } = useParams<{ repertoireId?: string }>();
  const [searchParams] = useSearchParams();
  const movesParam = searchParams.get("moves");
  const initialMoves = movesParam
    ? movesParam.split(",").filter(Boolean)
    : undefined;

  return (
    <div className="">
      <GradualRepertoireBuilder
        preselectedRepertoireId={repertoireId}
        initialMoves={initialMoves}
      />
    </div>
  );
};

export default GradualRepertoireBuilderPage;
