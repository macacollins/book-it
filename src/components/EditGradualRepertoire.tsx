import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Chess, Move } from "chess.js";
import ChessBoard from "./ChessBoard";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { UploadedPGNClient } from "../database/UploadedPGNClient";
import { GradualRepertoire, UploadedPGN } from "../database/types";

interface EditGradualRepertoireProps {
  visible: boolean;
  onHide: () => void;
  repertoire: GradualRepertoire;
  onSaved: (updated: GradualRepertoire) => void;
}

export const EditGradualRepertoire: React.FC<EditGradualRepertoireProps> = ({
  visible,
  onHide,
  repertoire,
  onSaved,
}) => {
  const [name, setName] = useState(repertoire.name);
  const [startingFEN, setStartingFEN] = useState(repertoire.startingFEN);
  const [startingMoves, setStartingMoves] = useState<string[]>(
    repertoire.startingMoves,
  );
  const [sourceRepertoireId, setSourceRepertoireId] = useState<string | null>(
    repertoire.sourceRepertoireId,
  );
  const [coverageDepthPlies, setCoverageDepthPlies] = useState<number>(
    repertoire.coverageDepthPlies ?? 7,
  );
  const [minimumGamesThreshold, setMinimumGamesThreshold] = useState<number>(
    repertoire.minimumGamesThreshold ?? 5,
  );
  const [availableRepertoires, setAvailableRepertoires] = useState<
    UploadedPGN[]
  >([]);

  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess(repertoire.startingFEN));
  const madeMoveRef = useRef(false);

  // Reset form when dialog opens or repertoire changes
  useEffect(() => {
    if (visible) {
      setName(repertoire.name);
      setStartingFEN(repertoire.startingFEN);
      setStartingMoves(repertoire.startingMoves);
      setSourceRepertoireId(repertoire.sourceRepertoireId);
      setCoverageDepthPlies(repertoire.coverageDepthPlies ?? 7);
      setMinimumGamesThreshold(repertoire.minimumGamesThreshold ?? 5);
      gameRef.current = new Chess();
      for (const san of repertoire.startingMoves) {
        gameRef.current.move(san);
      }
      UploadedPGNClient.getByType("repertoire").then(setAvailableRepertoires);
    }
  }, [visible, repertoire]);

  const handleMoveCallback = (move: Move): boolean => {
    setStartingMoves((prev) => [...prev, move.san]);
    setStartingFEN(move.after);
    return true;
  };

  const handleBack = () => {
    if (startingMoves.length === 0) return;
    const newMoves = startingMoves.slice(0, -1);
    const chess = new Chess();
    for (const san of newMoves) chess.move(san);
    const newFEN = chess.fen();
    gameRef.current = chess;
    chessboardRef.current?.position(newFEN);
    setStartingMoves(newMoves);
    setStartingFEN(newFEN);
  };

  const handleSave = async () => {
    await GradualRepertoireClient.updateMetadata(repertoire.id, {
      name,
      startingFEN,
      startingMoves,
      sourceRepertoireId,
      coverageDepthPlies,
      minimumGamesThreshold,
    });
    const updated = await GradualRepertoireClient.getById(repertoire.id);
    if (updated) onSaved(updated);
    onHide();
  };

  const isValid = name.trim() !== "" && startingFEN.trim() !== "";

  return (
    <Dialog
      header={`Edit Repertoire: ${repertoire.name}`}
      visible={visible}
      onHide={onHide}
      style={{ width: "560px" }}
      modal
    >
      <div className="field mb-3">
        <label htmlFor="edit-rep-name" className="block mb-1">
          Name
        </label>
        <InputText
          id="edit-rep-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="field mb-3">
        <label htmlFor="edit-source-rep" className="block mb-1">
          Source Repertoire
        </label>
        <Dropdown
          id="edit-source-rep"
          value={sourceRepertoireId}
          options={[
            { label: "(none)", value: null },
            ...availableRepertoires.map((r) => ({
              label: r.filename,
              value: r.id,
            })),
          ]}
          onChange={(e) => setSourceRepertoireId(e.value)}
          placeholder="Select a source repertoire"
          className="w-full"
        />
      </div>

      <div className="field mb-3">
        <label htmlFor="edit-depth" className="block mb-1">
          Coverage Depth (plies)
        </label>
        <InputNumber
          id="edit-depth"
          value={coverageDepthPlies}
          onValueChange={(e) => setCoverageDepthPlies(e.value ?? 7)}
          min={1}
          max={20}
          showButtons
          className="w-full"
        />
      </div>

      <div className="field mb-3">
        <label htmlFor="edit-min-games" className="block mb-1">
          Minimum Games Threshold
        </label>
        <InputNumber
          id="edit-min-games"
          value={minimumGamesThreshold}
          onValueChange={(e) => setMinimumGamesThreshold(e.value ?? 5)}
          min={1}
          max={1000}
          showButtons
          className="w-full"
        />
      </div>

      <div className="field mb-3">
        <label className="block mb-1">
          Starting Moves
        </label>
        <div className="flex align-items-center gap-2 mb-2">
          <Button
            label="Back"
            icon="bi bi-arrow-left"
            className="p-button-outlined p-button-sm"
            onClick={handleBack}
            disabled={startingMoves.length === 0}
          />
          {startingMoves.length > 0 ? (
            <span className="text-sm">{startingMoves.join(" ")}</span>
          ) : (
            <span className="text-sm text-color-secondary">
              Starting position
            </span>
          )}
        </div>
        <ChessBoard
          name="edit-rep-board"
          game_url="edit-rep"
          fen={startingFEN}
          draggable={true}
          madeMoveRef={madeMoveRef}
          moveCallback={handleMoveCallback}
          chessboardRef={chessboardRef}
          gameRef={gameRef}
          size="300px"
        />
      </div>

      <div className="flex justify-content-end gap-2 mt-3">
        <Button label="Cancel" className="p-button-text" onClick={onHide} />
        <Button
          label="Save"
          icon="bi bi-check"
          onClick={handleSave}
          disabled={!isValid}
        />
      </div>
    </Dialog>
  );
};
