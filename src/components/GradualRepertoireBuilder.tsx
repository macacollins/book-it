import React, { useState, useEffect } from "react";
import {
  RepertoireSetupForm,
  RepertoireSetupResult,
} from "./RepertoireSetupForm";
import { MoveSourceChooser, MoveSource } from "./MoveSourceChooser";
import { SinglePositionBuilder } from "./SinglePositionBuilder";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import "bootstrap-icons/font/bootstrap-icons.css";

interface GradualRepertoireBuilderProps {
  preselectedRepertoireId?: string;
  initialMoves?: string[];
}

export function GradualRepertoireBuilder({
  preselectedRepertoireId,
  initialMoves,
}: GradualRepertoireBuilderProps = {}) {
  const [setupResult, setSetupResult] = useState<RepertoireSetupResult | null>(
    null,
  );
  const [moveSource, setMoveSource] = useState<MoveSource>("frequency");

  const token = localStorage.getItem("lichessToken");

  // If a repertoire ID was passed via URL, load it and skip the setup form
  useEffect(() => {
    if (!preselectedRepertoireId) return;
    GradualRepertoireClient.getById(preselectedRepertoireId).then((grb) => {
      if (grb) {
        setSetupResult({
          id: grb.id,
          name: grb.name,
          color: grb.color,
          startingFEN: grb.startingFEN,
          startingMoves: grb.startingMoves,
          sourceRepertoireId: grb.sourceRepertoireId,
        });
      }
    });
  }, [preselectedRepertoireId]);

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
      initialMoves={initialMoves}
      onHome={() => setSetupResult(null)}
    />
  );
}
