import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LichessStatistics from "./LichessStatistics";

// Mock the LichessClient
jest.mock("../integrations/lichess-client", () => ({
  LichessClient: jest.fn().mockImplementation(() => ({
    openingExplorerLichess: jest.fn().mockResolvedValue({
      opening: {
        eco: "E04",
        name: "Catalan Opening",
      },
      white: 1500,
      black: 1200,
      draws: 800,
      moves: [
        {
          san: "Nf6",
          uci: "g8f6",
          white: 800,
          black: 600,
          draws: 200,
          averageRating: 1750,
        },
        {
          san: "d5",
          uci: "d7d5",
          white: 700,
          black: 600,
          draws: 600,
          averageRating: 1800,
        },
      ],
      topGames: [
        {
          id: "game1",
          white: { name: "Player1", rating: 1750 },
          black: { name: "Player2", rating: 1680 },
          year: 2024,
          month: "01",
          speed: "rapid",
          winner: "white",
        },
      ],
    }),
  })),
}));

describe("LichessStatistics", () => {
  const testFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  it("renders loading state initially", async () => {
    render(<LichessStatistics fen={testFen} />);
    expect(screen.getByText("Loading Lichess data...")).toBeInTheDocument();
  });

  it("renders lichess data when loaded", async () => {
    render(<LichessStatistics fen={testFen} />);

    await waitFor(() => {
      expect(
        screen.getByText("Lichess Statistics (1600-2000 rated)"),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Catalan Opening")).toBeInTheDocument();
    expect(screen.getByText("ECO: E04")).toBeInTheDocument();
    expect(screen.getByText("3500")).toBeInTheDocument(); // Total games
    expect(screen.getByText("1500")).toBeInTheDocument(); // White wins
  });

  it("handles empty FEN gracefully", () => {
    render(<LichessStatistics fen="" />);
    // Should not make API call with empty FEN
    expect(
      screen.queryByText("Loading Lichess data..."),
    ).not.toBeInTheDocument();
  });
});
