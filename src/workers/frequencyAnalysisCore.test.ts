import {
  processExplorerResponse,
  buildRepertoireFromGradual,
} from "./frequencyAnalysisCore";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("buildRepertoireFromGradual", () => {
  test("returns empty repertoire for no lines", () => {
    const result = buildRepertoireFromGradual(STARTING_FEN, []);
    expect(Object.keys(result)).toHaveLength(0);
  });

  test("builds repertoire from a single one-move line", () => {
    const lines = [["e4"]];
    const result = buildRepertoireFromGradual(STARTING_FEN, lines);

    // Starting position should map to e4
    expect(result[STARTING_FEN]).toEqual(["e4"]);

    // The position after e4 should exist as a final position
    const afterE4 =
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    expect(afterE4 in result).toBe(true);
  });

  test("builds repertoire from a multi-move line", () => {
    const lines = [["e4", "e5", "Nf3"]];
    const result = buildRepertoireFromGradual(STARTING_FEN, lines);

    // Starting FEN -> e4
    expect(result[STARTING_FEN]).toEqual(["e4"]);

    // After e4 -> e5
    const afterE4 =
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    expect(result[afterE4]).toEqual(["e5"]);

    // After e4 e5 -> Nf3
    const afterE4E5 =
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
    expect(result[afterE4E5]).toEqual(["Nf3"]);
  });

  test("merges moves from multiple lines at the same position", () => {
    const lines = [["e4", "e5"], ["e4", "c5"]];
    const result = buildRepertoireFromGradual(STARTING_FEN, lines);

    // Starting FEN should have e4 only once
    expect(result[STARTING_FEN]).toEqual(["e4"]);

    // After e4 should have both e5 and c5
    const afterE4 =
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    expect(result[afterE4]).toContain("e5");
    expect(result[afterE4]).toContain("c5");
    expect(result[afterE4]).toHaveLength(2);
  });

  test("does not duplicate moves in the same position", () => {
    const lines = [
      ["e4", "e5"],
      ["e4", "e5", "Nf3"],
    ];
    const result = buildRepertoireFromGradual(STARTING_FEN, lines);

    expect(result[STARTING_FEN]).toEqual(["e4"]);

    const afterE4 =
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    expect(result[afterE4]).toEqual(["e5"]);
  });

  test("handles diverging lines correctly", () => {
    const lines = [
      ["e4", "e5", "Nf3"],
      ["d4", "d5"],
    ];
    const result = buildRepertoireFromGradual(STARTING_FEN, lines);

    // Starting FEN should have both e4 and d4
    expect(result[STARTING_FEN]).toContain("e4");
    expect(result[STARTING_FEN]).toContain("d4");
  });

  test("works from a non-starting position", () => {
    const sicilianFen =
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
    const lines = [["Nf3", "d6"]];
    const result = buildRepertoireFromGradual(sicilianFen, lines);

    expect(result[sicilianFen]).toEqual(["Nf3"]);
    expect(sicilianFen in result).toBe(true);
  });

  test("final position of each line is included in repertoire", () => {
    const lines = [["e4", "e5"]];
    const result = buildRepertoireFromGradual(STARTING_FEN, lines);

    const afterE4E5 =
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
    expect(afterE4E5 in result).toBe(true);
    expect(result[afterE4E5]).toEqual([]);
  });
});

describe("processExplorerResponse", () => {
  const baseExplorerData = {
    white: 1000,
    draws: 500,
    black: 500,
    moves: [
      {
        uci: "e2e4",
        san: "e4",
        white: 600,
        draws: 200,
        black: 200,
        averageRating: 2100,
      },
      {
        uci: "d2d4",
        san: "d4",
        white: 300,
        draws: 200,
        black: 200,
        averageRating: 2050,
      },
      {
        uci: "c2c4",
        san: "c4",
        white: 100,
        draws: 100,
        black: 100,
        averageRating: 2000,
      },
    ],
  };

  test("returns correct number of moves", () => {
    const result = processExplorerResponse(STARTING_FEN, baseExplorerData, {});
    expect(result).toHaveLength(3);
  });

  test("calculates percentage correctly", () => {
    const result = processExplorerResponse(STARTING_FEN, baseExplorerData, {});

    // e4: 1000 out of 2000 total = 50%
    expect(result[0].percentage).toBeCloseTo(50, 1);
    // d4: 700 out of 2000 total = 35%
    expect(result[1].percentage).toBeCloseTo(35, 1);
    // c4: 300 out of 2000 total = 15%
    expect(result[2].percentage).toBeCloseTo(15, 1);
  });

  test("calculates win rate correctly", () => {
    const result = processExplorerResponse(STARTING_FEN, baseExplorerData, {});

    // e4: 600 white wins out of 1000 = 60%
    expect(result[0].winRate).toBeCloseTo(60, 1);
    // d4: 300 white wins out of 700 ≈ 42.86%
    expect(result[1].winRate).toBeCloseTo(42.86, 1);
    // c4: 100 white wins out of 300 ≈ 33.33%
    expect(result[2].winRate).toBeCloseTo(33.33, 1);
  });

  test("calculates total games per move", () => {
    const result = processExplorerResponse(STARTING_FEN, baseExplorerData, {});

    expect(result[0].totalGames).toBe(1000);
    expect(result[1].totalGames).toBe(700);
    expect(result[2].totalGames).toBe(300);
  });

  test("includes san and uci", () => {
    const result = processExplorerResponse(STARTING_FEN, baseExplorerData, {});

    expect(result[0].san).toBe("e4");
    expect(result[0].uci).toBe("e2e4");
    expect(result[1].san).toBe("d4");
    expect(result[2].san).toBe("c4");
  });

  test("produces correct resulting FEN after move", () => {
    const result = processExplorerResponse(STARTING_FEN, baseExplorerData, {});

    // After 1. e4 from the starting position
    expect(result[0].resultingFen).toBe(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    );
    // After 1. d4
    expect(result[1].resultingFen).toBe(
      "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1",
    );
  });

  test("marks moves as in repertoire when resulting FEN exists", () => {
    const e4Fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const repertoire = {
      [e4Fen]: ["e5", "c5"],
    };

    const result = processExplorerResponse(
      STARTING_FEN,
      baseExplorerData,
      repertoire,
    );

    expect(result[0].inRepertoire).toBe(true); // e4 FEN is in repertoire
    expect(result[1].inRepertoire).toBe(false); // d4 FEN is not
    expect(result[2].inRepertoire).toBe(false); // c4 FEN is not
  });

  test("marks all moves as not in repertoire when repertoire is empty", () => {
    const result = processExplorerResponse(STARTING_FEN, baseExplorerData, {});

    result.forEach((move) => {
      expect(move.inRepertoire).toBe(false);
    });
  });

  test("handles empty moves list", () => {
    const emptyData = { white: 0, draws: 0, black: 0, moves: [] };
    const result = processExplorerResponse(STARTING_FEN, emptyData, {});

    expect(result).toHaveLength(0);
  });

  test("handles zero total games gracefully", () => {
    const zeroData = {
      white: 0,
      draws: 0,
      black: 0,
      moves: [
        {
          uci: "e2e4",
          san: "e4",
          white: 0,
          draws: 0,
          black: 0,
          averageRating: 0,
        },
      ],
    };

    const result = processExplorerResponse(STARTING_FEN, zeroData, {});

    expect(result[0].percentage).toBe(0);
    expect(result[0].winRate).toBe(0);
    expect(result[0].totalGames).toBe(0);
  });

  test("works from a non-starting position", () => {
    const sicilianFen =
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
    const explorerData = {
      white: 500,
      draws: 200,
      black: 300,
      moves: [
        {
          uci: "g1f3",
          san: "Nf3",
          white: 400,
          draws: 150,
          black: 200,
          averageRating: 2100,
        },
        {
          uci: "b1c3",
          san: "Nc3",
          white: 100,
          draws: 50,
          black: 100,
          averageRating: 2000,
        },
      ],
    };

    const result = processExplorerResponse(sicilianFen, explorerData, {});

    expect(result).toHaveLength(2);
    expect(result[0].san).toBe("Nf3");
    // Verify the resulting FEN is after Nf3 in Sicilian
    expect(result[0].resultingFen).toContain("5N2");

    // Actually check it's a valid FEN by verifying it has the right structure
    expect(result[0].resultingFen.split(" ")).toHaveLength(6);
    expect(result[1].resultingFen.split(" ")).toHaveLength(6);
  });

  test("works from a non-starting position with repertoire check", () => {
    const sicilianFen =
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
    const explorerData = {
      white: 500,
      draws: 200,
      black: 300,
      moves: [
        {
          uci: "g1f3",
          san: "Nf3",
          white: 400,
          draws: 150,
          black: 200,
          averageRating: 2100,
        },
      ],
    };

    // Get the resulting FEN first
    const preResult = processExplorerResponse(sicilianFen, explorerData, {});
    const nf3Fen = preResult[0].resultingFen;

    // Now test with that FEN in the repertoire
    const repertoire = { [nf3Fen]: ["d6", "Nc6"] };
    const result = processExplorerResponse(
      sicilianFen,
      explorerData,
      repertoire,
    );

    expect(result[0].inRepertoire).toBe(true);
  });
});
