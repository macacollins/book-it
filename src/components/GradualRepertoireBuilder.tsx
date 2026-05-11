import React, { useState } from "react";
import {
  RepertoireSetupForm,
  RepertoireSetupResult,
} from "./RepertoireSetupForm";
import { MoveSourceChooser, MoveSource } from "./MoveSourceChooser";
import { SinglePositionBuilder } from "./SinglePositionBuilder";
import "bootstrap-icons/font/bootstrap-icons.css";

export function GradualRepertoireBuilder() {
  const [setupResult, setSetupResult] = useState<RepertoireSetupResult | null>(
    null,
  );
  const [moveSource, setMoveSource] = useState<MoveSource>("frequency");

  const token = localStorage.getItem("lichessToken");

  if (!token) {
    return (
      <div className="p-3">
        <h3>Lichess Token Required</h3>
        <p>
          Please set your Lichess API token in the Database page before using
          the Repertoire Builder.
        </p>
      </div>
    );
  }

  if (!setupResult) {
    return <RepertoireSetupForm onConfirm={setSetupResult} />;
  }

  // if (!moveSource) {
  //   return <MoveSourceChooser onSelect={setMoveSource} />;
  // }

  return (
    <SinglePositionBuilder
      repertoireId={setupResult.id}
      name={setupResult.name}
      color={setupResult.color}
      startingFEN={setupResult.startingFEN}
      sourceRepertoireId={setupResult.sourceRepertoireId}
      moveSource={moveSource}
      token={token}
      onHome={() => setSetupResult(null)}
    />
  );
}
