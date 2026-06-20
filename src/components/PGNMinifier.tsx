import React, { useState } from "react";
import pgnParser, { ParsedPGN, Move } from "pgn-parser";
import { FileUpload, FileUploadSelectEvent } from "primereact/fileupload";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";

/** Render just the move tokens from a flat move list, no comments or annotations. */
function minifyMoves(moves: Move[]): string {
  const tokens: string[] = [];
  let plyIndex = 0;

  for (const move of moves) {
    if (!move.move) continue;
    // Move numbers appear before white's move (even plyIndex = 0, 2, 4…)
    if (plyIndex % 2 === 0) {
      tokens.push(`${Math.floor(plyIndex / 2) + 1}.`);
    }
    tokens.push(move.move);
    plyIndex++;
  }

  return tokens.join(" ");
}

function minifyPGN(parsed: ParsedPGN[]): string {
  return parsed
    .map((game) => {
      const headers = (game.headers ?? [])
        .map((h) => `[${h.name} "${h.value}"]`)
        .join("\n");
      const moves = minifyMoves(game.moves ?? []);
      // Preserve result token if present
      const result = (game as any).result ?? "";
      return headers ? `${moves}${result ? " " + result : ""}` : `${moves}${result ? " " + result : ""}`;
    })
    .join("\n");
}

export default function PGNMinifier() {
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [minifiedText, setMinifiedText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("minified.pgn");
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (event: FileUploadSelectEvent) => {
    const file = event.files[0];
    if (!file) return;

    setFileName(file.name.replace(/\.pgn$/i, "-minified.pgn"));
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setOriginalText(text);
      try {
        const parsed = pgnParser.parse(text);
        setMinifiedText(minifyPGN(parsed));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setMinifiedText(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!minifiedText) return;
    const blob = new Blob([minifiedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 flex flex-column gap-3">
      <h2 className="m-0">PGN Minifier</h2>
      <p className="m-0 text-color-secondary">
        Upload a PGN file to strip comments, arrows, and annotations, leaving only the moves.
      </p>

      <FileUpload
        mode="basic"
        accept=".pgn"
        maxFileSize={10000000}
        chooseLabel="Upload PGN"
        auto={false}
        onSelect={handleSelect}
        customUpload
      />

      {error && (
        <div className="p-message p-message-error">
          <span className="p-message-text">Failed to parse PGN: {error}</span>
        </div>
      )}

      {minifiedText !== null && originalText !== null && (
        <div className="flex flex-column gap-2">
          <div className="flex justify-content-end">
            <Button
              label="Download Minified PGN"
              icon="pi pi-download"
              onClick={handleDownload}
            />
          </div>
          <TabView>
            <TabPanel header="Minified">
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "60vh",
                  overflow: "auto",
                  background: "#1f2937",
                  padding: "1rem",
                  borderRadius: "6px",
                  margin: 0,
                }}
              >
                {minifiedText}
              </pre>
            </TabPanel>
            <TabPanel header="Original">
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "60vh",
                  overflow: "auto",
                  background: "#1f2937",
                  padding: "1rem",
                  borderRadius: "6px",
                  margin: 0,
                }}
              >
                {originalText}
              </pre>
            </TabPanel>
          </TabView>
        </div>
      )}
    </div>
  );
}
