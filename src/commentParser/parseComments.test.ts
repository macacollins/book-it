import parseComments, { CommentNode } from "./parseComments";
import pgnParser, { ParsedPGN } from "pgn-parser";

const basicGame = pgnParser.parse("1.e4 *")[0];

test("Basic test parseComments", () => {
  let pgnResults = parseComments("1.e4 e5 2.c4 c5", basicGame);

  let expectedResults = [
    {
      type: "Move",
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      text: "1.e4",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      text: "e5",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/2P1P3/8/PP1P1PPP/RNBQKBNR b KQkq - 0 2",
      text: "2.c4",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1p1ppp/8/2p1p3/2P1P3/8/PP1P1PPP/RNBQKBNR w KQkq - 0 3",
      text: "c5",
    },
  ];

  expect(pgnResults).toEqual(expectedResults);
});

test("Basic test before and after text", () => {
  let pgnResults = parseComments(
    "The line is 1.e4 e5 2.c4 c5 after that.",
    basicGame,
  );

  let expectedResults = [
    {
      type: "Text",
      text: "The line is ",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      text: "1.e4",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      text: "e5",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/2P1P3/8/PP1P1PPP/RNBQKBNR b KQkq - 0 2",
      text: "2.c4",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1p1ppp/8/2p1p3/2P1P3/8/PP1P1PPP/RNBQKBNR w KQkq - 0 3",
      text: "c5",
    },
    { type: "Text", text: " after that." },
  ];

  expect(pgnResults).toEqual(expectedResults);
});

test("Basic test with FEN", () => {
  let pgnResults = parseComments(
    "The line is @@StartFEN@@rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1@@EndFEN@@ 1...e5 2.c4 c5 after that.",
    basicGame,
  );

  let expectedResults = [
    {
      type: "Text",
      text: "The line is ",
    },
    {
      type: "FEN",
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      text: "FEN",
    },
    {
      text: " ",
      type: "Text",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      text: "1...e5",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pppp1ppp/8/4p3/2P1P3/8/PP1P1PPP/RNBQKBNR b KQkq - 0 2",
      text: "2.c4",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1p1ppp/8/2p1p3/2P1P3/8/PP1P1PPP/RNBQKBNR w KQkq - 0 3",
      text: "c5",
    },
    {
      type: "Text",
      text: " after that.",
    },
  ];

  expect(pgnResults).toEqual(expectedResults);
});

test("Alternate Move Option for main line", () => {
  let pgnResults = parseComments("An alternative is 1...c5", basicGame);

  let expectedResults = [
    {
      type: "Text",
      text: "An alternative is ",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      text: "1...c5",
    },
  ];

  expect(pgnResults).toEqual(expectedResults);
});

test("Alternate Move Option for main line second move", () => {
  let pgnResults = parseComments(
    "An alternative is 2.Nc3",
    pgnParser.parse("1.e4 c5 2.d4 *")[0],
  );

  let expectedResults = [
    {
      type: "Text",
      text: "An alternative is ",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 2",
      text: "2.Nc3",
    },
  ];

  expect(pgnResults).toEqual(expectedResults);
});

test("Multiple Alternate Move Options", () => {
  let pgnResults = parseComments(
    "Alternatives include 2.Nc3 and 2.e5",
    pgnParser.parse("1.e4 c5 2.d4 *")[0],
  );

  let expectedResults = [
    {
      type: "Text",
      text: "Alternatives include ",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 2",
      text: "2.Nc3",
    },
    {
      type: "Text",
      text: " and ",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1ppppp/8/2p1P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2",
      text: "2.e5",
    },
  ];

  expect(pgnResults).toEqual(expectedResults);
});

test("Multiple Alternate Move Options with comma", () => {
  let pgnResults = parseComments(
    "Alternatives include 2.Nc3 and 2.b4 and 2.e5",
    pgnParser.parse("1.e4 c5 2.d4 *")[0],
  );

  let expectedResults = [
    {
      type: "Text",
      text: "Alternatives include ",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 2",
      text: "2.Nc3",
    },

    {
      type: "Text",
      text: " and ",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1ppppp/8/2p5/1P2P3/8/P1PP1PPP/RNBQKBNR b KQkq - 0 2",
      text: "2.b4",
    },
    {
      type: "Text",
      text: " and ",
    },
    {
      type: "Move",
      fen: "rnbqkbnr/pp1ppppp/8/2p1P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2",
      text: "2.e5",
    },
  ];

  expect(pgnResults).toEqual(expectedResults);
});
