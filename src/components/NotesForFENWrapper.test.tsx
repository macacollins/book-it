import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NotesForFENWrapper from "./NotesForFENWrapper";

// Mock the child components
jest.mock("./FENChooser", () => {
  return function MockFENChooser({
    onFENChange,
  }: {
    onFENChange: (fen: string) => void;
  }) {
    return (
      <div data-testid="fen-chooser">
        <button onClick={() => onFENChange("new-fen")}>Change FEN</button>
      </div>
    );
  };
});

jest.mock("./NotesForFEN", () => {
  return function MockNotesForFEN({ fen }: { fen: string }) {
    return <div data-testid="notes-for-fen">Notes for: {fen}</div>;
  };
});

jest.mock("./MastersStatistics", () => {
  return function MockMastersStatistics({ fen }: { fen: string }) {
    return <div data-testid="masters-statistics">Masters stats for: {fen}</div>;
  };
});

jest.mock("./LichessStatistics", () => {
  return function MockLichessStatistics({ fen }: { fen: string }) {
    return <div data-testid="lichess-statistics">Lichess stats for: {fen}</div>;
  };
});

describe("NotesForFENWrapper", () => {
  it("renders all three tabs", () => {
    render(<NotesForFENWrapper />);

    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Masters")).toBeInTheDocument();
    expect(screen.getByText("Lichess Stats")).toBeInTheDocument();
  });

  it("renders FEN chooser and initial content", () => {
    render(<NotesForFENWrapper />);

    expect(screen.getByTestId("fen-chooser")).toBeInTheDocument();
    expect(screen.getByText("FEN Position Selector")).toBeInTheDocument();
    expect(screen.getByText("Usage Instructions:")).toBeInTheDocument();
  });

  it("renders the notes tab by default", () => {
    const initialFEN = "test-fen";
    render(<NotesForFENWrapper initialFEN={initialFEN} />);

    expect(screen.getByTestId("notes-for-fen")).toBeInTheDocument();
    expect(screen.getByText(`Notes for: ${initialFEN}`)).toBeInTheDocument();
  });

  it("includes usage instructions for all tabs", () => {
    render(<NotesForFENWrapper />);

    expect(
      screen.getByText(/Notes tab.*Enter notes in the text area/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Masters tab.*View statistics from the Lichess masters database/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Lichess Stats tab.*View statistics from Lichess games/),
    ).toBeInTheDocument();
  });
});
