import React, { useEffect } from "react";
import { RepertoireSetupForm } from "./RepertoireSetupForm";
import { SinglePositionBuilder } from "./SinglePositionBuilder";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";
import "bootstrap-icons/font/bootstrap-icons.css";

interface GradualRepertoireBuilderProps {
  preselectedRepertoireId?: string;
  initialMoves?: string[];
}

export function GradualRepertoireBuilder({
  preselectedRepertoireId,
  initialMoves,
}: GradualRepertoireBuilderProps = {}) {
  const setupResult = useGradualRepertoireBuilderStore((s) => s.setupResult);
  const setSetupResult = useGradualRepertoireBuilderStore((s) => s.setSetupResult);
  const token = useGradualRepertoireBuilderStore((s) => s.token);
  const setInitialMoves = useGradualRepertoireBuilderStore((s) => s.setInitialMoves);

  useEffect(() => {
    setInitialMoves(initialMoves);
  }, [initialMoves]);

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

  return <SinglePositionBuilder />;
}
