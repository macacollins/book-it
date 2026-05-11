import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { RadioButton } from "primereact/radiobutton";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Chess, Move } from "chess.js";
import ChessBoard from "./ChessBoard";
import { GradualRepertoireClient } from "../database/GradualRepertoireClient";
import { UploadedPGNClient } from "../database/UploadedPGNClient";
import { UploadedPGN, RepertoireColor } from "../database/types";
import { RepertoireSetupResult } from "./RepertoireSetupForm";

const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface CreateRepertoireDialogProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: (result: RepertoireSetupResult) => void;
}

export const CreateRepertoireDialog: React.FC<CreateRepertoireDialogProps> = ({
  visible,
  onHide,
  onConfirm,
}) => {
  const [startMode, setStartMode] = useState<"scratch" | "existing">("scratch");
  const [name, setName] = useState("");
  const [color, setColor] = useState<RepertoireColor>("white");
  const [startingFEN, setStartingFEN] = useState(DEFAULT_FEN);
  const [startingMoves, setStartingMoves] = useState<string[]>([]);
  const [selectedRepertoireId, setSelectedRepertoireId] = useState<string | null>(null);
  const [availableRepertoires, setAvailableRepertoires] = useState<UploadedPGN[]>([]);

  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());
  const madeMoveRef = useRef(false);

  useEffect(() => {
    if (visible) {
      UploadedPGNClient.getAll().then(setAvailableRepertoires);
      // Reset form state on open
      setStartMode("scratch");
      setName("");
      setColor("white");
      setStartingFEN(DEFAULT_FEN);
      setStartingMoves([]);
      setSelectedRepertoireId(null);
      gameRef.current = new Chess();
    }
  }, [visible]);

  const handleConfirm = async () => {
    const id = crypto.randomUUID();
    const repertoire = {
      id,
      name,
      color,
      startingFEN,
      startingMoves,
      sourceRepertoireId: startMode === "existing" ? selectedRepertoireId : null,
      lines: [],
      timestamp: Date.now(),
      coverageDepthPlies: 7,
      minimumGamesThreshold: 5,
      cachedCoveragePercent: null,
    };
    await GradualRepertoireClient.insert(repertoire);
    onConfirm({
      id,
      name,
      color,
      startingFEN,
      startingMoves,
      sourceRepertoireId: repertoire.sourceRepertoireId,
    });
    onHide();
  };

  const handleSetupMoveCallback = (move: Move): boolean => {
    setStartingMoves((prev) => [...prev, move.san]);
    setStartingFEN(move.after);
    return true;
  };

  const handleSetupBack = () => {
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

  const isValid =
    name.trim() !== "" &&
    startingFEN.trim() !== "" &&
    (startMode === "scratch" || selectedRepertoireId !== null);

  return (
    <Dialog
      header="Create Gradual Repertoire"
      visible={visible}
      onHide={onHide}
      style={{ width: "520px" }}
      modal
    >
      <div className="field mb-3">
        <label htmlFor="rep-name" className="block mb-1">
          Repertoire Name
        </label>
        <InputText
          id="rep-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Repertoire"
          className="w-full"
        />
      </div>

      <div className="field mb-3">
        <label className="block mb-1">Starting Point</label>
        <div className="flex gap-3">
          <div className="flex align-items-center">
            <RadioButton
              inputId="cr-scratch"
              value="scratch"
              checked={startMode === "scratch"}
              onChange={() => setStartMode("scratch")}
            />
            <label htmlFor="cr-scratch" className="ml-2">
              Start from scratch
            </label>
          </div>
          <div className="flex align-items-center">
            <RadioButton
              inputId="cr-existing"
              value="existing"
              checked={startMode === "existing"}
              onChange={() => setStartMode("existing")}
            />
            <label htmlFor="cr-existing" className="ml-2">
              Start from existing repertoire
            </label>
          </div>
        </div>
      </div>

      {startMode === "existing" && (
        <div className="field mb-3">
          <label htmlFor="cr-source-rep" className="block mb-1">
            Source Repertoire
          </label>
          <Dropdown
            id="cr-source-rep"
            value={selectedRepertoireId}
            options={availableRepertoires.map((r) => ({
              label: r.filename,
              value: r.id,
            }))}
            onChange={(e) => setSelectedRepertoireId(e.value)}
            placeholder="Select a repertoire"
            className="w-full"
          />
        </div>
      )}

      <div className="field mb-3">
        <label className="block mb-1">Color</label>
        <div className="flex gap-3">
          <div className="flex align-items-center">
            <RadioButton
              inputId="cr-white"
              value="white"
              checked={color === "white"}
              onChange={() => setColor("white")}
            />
            <label htmlFor="cr-white" className="ml-2">
              White
            </label>
          </div>
          <div className="flex align-items-center">
            <RadioButton
              inputId="cr-black"
              value="black"
              checked={color === "black"}
              onChange={() => setColor("black")}
            />
            <label htmlFor="cr-black" className="ml-2">
              Black
            </label>
          </div>
        </div>
      </div>

      <div className="field mb-3">
        <label htmlFor="cr-starting-fen" className="block mb-1">
          Starting Position (FEN)
        </label>
        <InputText
          id="cr-starting-fen"
          value={startingFEN}
          onChange={(e) => setStartingFEN(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="field mb-3">
        <label className="block mb-1">Starting Moves (play on board)</label>
        <div className="flex align-items-center gap-2 mb-2">
          <Button
            label="Back"
            icon="bi bi-arrow-left"
            className="p-button-outlined p-button-sm"
            onClick={handleSetupBack}
            disabled={startingMoves.length === 0}
          />
          {startingMoves.length > 0 ? (
            <span className="text-sm">{startingMoves.join(" ")}</span>
          ) : (
            <span className="text-sm text-color-secondary">
              Play moves to set the starting position
            </span>
          )}
        </div>
        <ChessBoard
          name="cr-setup-board"
          game_url="cr-setup"
          fen={DEFAULT_FEN}
          draggable={true}
          madeMoveRef={madeMoveRef}
          moveCallback={handleSetupMoveCallback}
          chessboardRef={chessboardRef}
          gameRef={gameRef}
          size="300px"
        />
      </div>

      <div className="flex justify-content-end gap-2 mt-3">
        <Button label="Cancel" className="p-button-text" onClick={onHide} />
        <Button
          label="Create Repertoire"
          icon="bi bi-check"
          onClick={handleConfirm}
          disabled={!isValid}
        />
      </div>
    </Dialog>
  );
};
