import React, { useState, useRef, useEffect } from "react";
import { Card } from "primereact/card";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Panel } from "primereact/panel";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Chess } from "chess.js";
import ChessBoard from "./ChessBoard";
import { calculateSlimRepertoire } from "../integrations/calculateSlimRepertoire";
import { UploadedPGNClient } from "../database/UploadedPGNClient";
import { UploadedPGN } from "../database/types";
import {
  useSlimRepertoire,
  clearRepertoireCache,
} from "../hooks/useSlimRepertoire";

interface RepertoireUploadProps {
  className?: string;
}

const startingFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const RepertoireUpload: React.FC<RepertoireUploadProps> = ({}) => {
  const [uploadedPGNs, setUploadedPGNs] = useState<UploadedPGN[]>([]);
  const [selectedPGN, setSelectedPGN] = useState<UploadedPGN | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRepertoireNameField, setNewRepertoireNameField] = useState("test");
  const [currentPosition, setCurrentPosition] = useState(startingFEN);
  const [availableMoves, setAvailableMoves] = useState<string[]>([]);
  const [currentNotes, setCurrentNotes] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const chessboardRef = useRef<any>(null);
  const gameRef = useRef<Chess>(new Chess());

  // Use the hook to load repertoire
  const {
    repertoire: uploadedRepertoire,
    positionNotes,
    loading: repertoireLoading,
    error: repertoireError,
  } = useSlimRepertoire(selectedPGN?.filename || null);

  // Load all repertoire PGNs from database
  useEffect(() => {
    const loadRepertoirePGNs = async () => {
      try {
        setLoading(true);
        const repertoirePGNs = await UploadedPGNClient.getByType("repertoire");
        setUploadedPGNs(repertoirePGNs);
      } catch (err) {
        console.error("Error loading repertoire PGNs:", err);
        setUploadError("Failed to load repertoires from database");
      } finally {
        setLoading(false);
      }
    };

    loadRepertoirePGNs();
  }, []);

  // Update UI when repertoire is loaded
  useEffect(() => {
    if (uploadedRepertoire) {
      resetToStartingPosition();
      setSuccess(`Repertoire "${selectedPGN?.filename}" loaded successfully!`);
    }
  }, [uploadedRepertoire]);

  // Handle selection of repertoire from dropdown
  const handleRepertoireSelect = async (pgn: UploadedPGN) => {
    setUploadError(null);
    setSuccess(null);
    setSelectedPGN(pgn);
  };

  const handleFileUpload = async (event: any) => {
    const file = event.files[0];
    if (!file) return;

    if (!newRepertoireNameField.trim()) {
      setUploadError("Please enter a repertoire name before uploading.");
      return;
    }

    setUploadError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContents = e.target?.result as string;

      try {
        // Calculate and cache the repertoire
        const notes: Record<string, string> = {};
        const setComments = (
          fen: string,
          _repertoireName: string,
          comments: any[],
        ) => {
          const commentText = comments.map((c: any) => c.text || c).join(" ");
          notes[fen] = commentText;
        };

        const repertoire = calculateSlimRepertoire(
          fileContents,
          newRepertoireNameField,
          setComments,
        );

        // Store in localStorage
        const cacheKey = "SLIM_REPERTOIRE_CACHE_" + newRepertoireNameField;
        const notesKey = "SLIM_REPERTOIRE_NOTES_" + newRepertoireNameField;
        localStorage.setItem(cacheKey, JSON.stringify(repertoire));
        localStorage.setItem(notesKey, JSON.stringify(notes));

        // Create a pseudo-PGN entry to trigger the hook
        setSelectedPGN({
          filename: newRepertoireNameField,
          content: fileContents,
        } as UploadedPGN);
        setSuccess(
          `Repertoire "${newRepertoireNameField}" uploaded and cached successfully!`,
        );
      } catch (err) {
        setUploadError(
          `Failed to process repertoire: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        console.error("Error processing repertoire:", err);
      }
    };

    reader.readAsText(file);
  };

  const resetToStartingPosition = () => {
    const startingFEN =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    gameRef.current = new Chess();
    setCurrentPosition(startingFEN);

    if (chessboardRef.current) {
      chessboardRef.current.position(startingFEN);
    }

    updateAvailableMoves(startingFEN);
  };

  const updateAvailableMoves = (fen: string) => {
    const funcStartTime = performance.now();

    if (!uploadedRepertoire) {
      setAvailableMoves([]);
      setCurrentNotes("");
      return;
    }

    // Look up moves available from this position in the repertoire
    const lookupStartTime = performance.now();
    const moves = uploadedRepertoire[fen] || [];
    const lookupEndTime = performance.now();
    console.log(
      `Move lookup time: ${(lookupEndTime - lookupStartTime).toFixed(2)}ms`,
    );

    const setMovesStartTime = performance.now();
    setAvailableMoves(moves);
    const setMovesEndTime = performance.now();
    console.log(
      `Set available moves time: ${(setMovesEndTime - setMovesStartTime).toFixed(2)}ms`,
    );

    // Get notes for this position
    const notesLookupStartTime = performance.now();
    const notes = positionNotes[fen] || "";
    const notesLookupEndTime = performance.now();
    console.log(
      `Notes lookup time: ${(notesLookupEndTime - notesLookupStartTime).toFixed(2)}ms`,
    );

    const setNotesStartTime = performance.now();
    setCurrentNotes(notes);
    const setNotesEndTime = performance.now();
    console.log(
      `Set notes time: ${(setNotesEndTime - setNotesStartTime).toFixed(2)}ms`,
    );

    const funcEndTime = performance.now();
    console.log(
      `Total updateAvailableMoves time: ${(funcEndTime - funcStartTime).toFixed(2)}ms`,
    );
  };

  const makeMove = (move: string) => {
    try {
      // Make the move on the chess game
      gameRef.current.move(move);
      const newFEN = gameRef.current.fen();

      // Update the board position
      setCurrentPosition(newFEN);
      if (chessboardRef.current) {
        chessboardRef.current.position(newFEN);
      }

      // Update available moves for the new position
      updateAvailableMoves(newFEN);
    } catch (err) {
      setUploadError(`Invalid move: ${move}`);
      console.error("Error making move:", err);
    }
  };

  const goBack = () => {
    if (gameRef.current.history().length > 0) {
      gameRef.current.undo();
      const newFEN = gameRef.current.fen();

      setCurrentPosition(newFEN);
      if (chessboardRef.current) {
        chessboardRef.current.position(newFEN);
      }

      updateAvailableMoves(newFEN);
    }
  };

  const updateCurrentNotes = (newNotes: string) => {
    if (!uploadedRepertoire) return;

    // Update notes for the current position
    // Note: positionNotes is read-only from the hook, so we just update local state
    setCurrentNotes(newNotes);

    // Optionally, save to localStorage if you want persistence
    const notesKey = "SLIM_REPERTOIRE_NOTES_" + selectedPGN?.filename;
    const allNotes = { ...positionNotes, [currentPosition]: newNotes };
    localStorage.setItem(notesKey, JSON.stringify(allNotes));
  };

  const formatMoveButton = (move: string, index: number) => {
    return (
      <Button
        key={index}
        label={move}
        onClick={() => makeMove(move)}
        className="mr-2 mb-2"
        size="small"
        outlined
      />
    );
  };

  if (loading || repertoireLoading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <ProgressSpinner />
        <div className="ml-3">
          {loading && <p>Loading repertoires...</p>}
          {repertoireLoading && <p>Loading repertoire data...</p>}
        </div>
      </div>
    );
  }

  const pgnOptions = uploadedPGNs.map((pgn) => ({
    label: pgn.filename,
    value: pgn,
  }));

  return (
    <div className={`repertoire-upload`}>
      <Card title="Repertoire Upload & Explorer" className="mb-4">
        <div className="grid">
          <div className="col-12 lg:col-6">
            <Panel header="Select Repertoire" className="mb-4">
              <div className="flex flex-column gap-3">
                <div className="field">
                  <label
                    htmlFor="repertoire-select"
                    className="block font-bold mb-2"
                  >
                    Select from Uploaded Repertoires
                  </label>
                  <Dropdown
                    id="repertoire-select"
                    value={selectedPGN}
                    options={pgnOptions}
                    onChange={async (e) => handleRepertoireSelect(e.value)}
                    placeholder="Choose a repertoire..."
                    className="w-full"
                    disabled={uploadedPGNs.length === 0}
                  />
                  {uploadedPGNs.length === 0 && (
                    <Message
                      severity="info"
                      text="No repertoires found. Upload a repertoire PGN from the Database page."
                      className="mt-2"
                    />
                  )}
                </div>

                <Divider align="center">
                  <span className="text-500">OR</span>
                </Divider>

                <div className="field">
                  <label
                    htmlFor="repertoire-name"
                    className="block font-bold mb-2"
                  >
                    Upload New Repertoire
                  </label>
                  <InputText
                    id="repertoire-name"
                    value={newRepertoireNameField}
                    onChange={(e) => setNewRepertoireNameField(e.target.value)}
                    placeholder="Enter repertoire name"
                    className="w-full mb-2"
                  />
                  <FileUpload
                    mode="basic"
                    name="repertoire-file"
                    accept=".pgn,.txt"
                    maxFileSize={10000000} // 10MB
                    onUpload={handleFileUpload}
                    onSelect={handleFileUpload}
                    auto
                    chooseLabel="Choose Repertoire File"
                    className="w-full"
                    disabled={!newRepertoireNameField.trim()}
                  />
                </div>

                {(uploadError || repertoireError) && (
                  <Message
                    severity="error"
                    text={uploadError || repertoireError || ""}
                    className="w-full"
                  />
                )}

                {success && (
                  <Message
                    severity="success"
                    text={success}
                    className="w-full"
                  />
                )}
              </div>
            </Panel>

            {uploadedRepertoire && (
              <Panel header="Navigation Controls" className="mb-4">
                <div className="flex gap-2 align-items-center">
                  <Button
                    icon="pi pi-arrow-left"
                    label="Back"
                    onClick={goBack}
                    disabled={gameRef.current?.history().length === 0}
                    size="small"
                  />
                  <Button
                    icon="pi pi-refresh"
                    label="Reset"
                    onClick={resetToStartingPosition}
                    severity="secondary"
                    size="small"
                  />
                </div>
              </Panel>
            )}
          </div>

          <div className="col-12 lg:col-6">
            {uploadedRepertoire && (
              <Card title="Chess Position" className="mb-4">
                <div className="flex flex-column align-items-center">
                  <ChessBoard
                    name="repertoire-explorer"
                    game_url="repertoire-upload"
                    fen={currentPosition}
                    chessboardRef={chessboardRef}
                    gameRef={gameRef}
                    draggable={false}
                    size="400px"
                  />

                  <div className="mt-3 text-sm text-500">
                    <strong>Current Position:</strong>{" "}
                    {gameRef.current?.history().length || 0} moves played
                  </div>
                </div>
              </Card>
            )}
          </div>

          {uploadedRepertoire && (
            <div className="col-12">
              <Divider />
              <Panel header="Available Moves" className="mt-4">
                {availableMoves.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableMoves.map((move, index) =>
                      formatMoveButton(move, index),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="pi pi-info-circle mr-2"></i>
                    No moves available in repertoire from this position.
                    {gameRef.current?.history().length > 0 && (
                      <div className="mt-2">
                        <Button
                          label="Go back to find repertoire moves"
                          onClick={goBack}
                          text
                          size="small"
                        />
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {uploadedRepertoire && (
            <div className="col-12">
              <Divider />
              <Panel header="Position Notes" className="mt-4">
                <div className="field">
                  <label
                    htmlFor="position-notes"
                    className="block font-bold mb-2"
                  >
                    Notes for current position:
                  </label>
                  <InputTextarea
                    id="position-notes"
                    value={currentNotes}
                    onChange={(e) => updateCurrentNotes(e.target.value)}
                    placeholder="Add notes about this position, moves, or strategy..."
                    rows={4}
                    className="w-full"
                    autoResize
                  />
                  <small className="text-500 mt-1 block">
                    Notes are automatically saved as you type and associated
                    with the current position.
                  </small>
                </div>
              </Panel>
            </div>
          )}

          {uploadedRepertoire && (
            <div className="col-12">
              <Divider />
              <Panel header="Repertoire Statistics" className="mt-4">
                <div className="text-sm text-600">
                  <strong>Repertoire Name:</strong>{" "}
                  {selectedPGN?.filename || "N/A"}
                  <br />
                  <strong>Total Positions:</strong>{" "}
                  {Object.keys(uploadedRepertoire).length}
                  <br />
                  <strong>Total Moves:</strong>{" "}
                  {Object.values(uploadedRepertoire).flat().length}
                </div>
              </Panel>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RepertoireUpload;
