import React, { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { RepertoireSetupForm } from "./RepertoireSetupForm";
import { SinglePositionBuilder } from "./SinglePositionBuilder";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { GradualRepertoire } from "../database/types";
import { useGradualRepertoireBuilderStore } from "./useGradualRepertoireBuilderStore";
import "bootstrap-icons/font/bootstrap-icons.css";
import { GRBWorkerProvider } from "./GRBWorkerContext";

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

  const [fenInput, setFenInput] = useState("");
  const [fenError, setFenError] = useState<string | null>(null);
  const [fullGrb, setFullGrb] = useState<GradualRepertoire | null>(null);

  // Keep a full copy of the GRB (with lines) for the FEN jump feature
  useEffect(() => {
    if (!setupResult?.id) {
      setFullGrb(null);
      return;
    }
    GradualRepertoireClient.getById(setupResult.id).then((grb) => {
      setFullGrb(grb ?? null);
    });
  }, [setupResult?.id]);

  // If a repertoire ID was passed via URL, load it and skip the setup form
  useEffect(() => {
    console.log("Running effect in gradualRepertoirebuilder.tsx")
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
    <>
      <GRBWorkerProvider>
        <SinglePositionBuilder initialMoves={initialMoves} />
      </GRBWorkerProvider>
    </>
  );
}
