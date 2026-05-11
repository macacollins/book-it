import {
  createMoveTree,
  addStartNode,
  addMoveNode,
  updateNotes,
  generateMoveTreeFromPGN,
  moveTreeToJSON,
  moveTreeFromJSON,
  getMainLine,
  countMoves,
  editMoveTreeName,
} from "./MoveTree";

describe("MoveTree", () => {
  const standardStartingFEN =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  describe("createMoveTree", () => {
    it("should create an empty move tree", () => {
      const tree = createMoveTree();
      expect(tree.name).toBe("");
      expect(tree.headers).toEqual({});
      expect(tree.nodes).toEqual([]);
    });

    it("should create a move tree with a name", () => {
      const tree = createMoveTree("Test Game");
      expect(tree.name).toBe("Test Game");
      expect(tree.headers).toEqual({});
      expect(tree.nodes).toEqual([]);
    });

    it("should create a move tree with name and headers", () => {
      const headers = {
        Event: "World Championship",
        White: "Player1",
        Black: "Player2",
      };
      const tree = createMoveTree("Test Game", headers);
      expect(tree.name).toBe("Test Game");
      expect(tree.headers).toEqual(headers);
      expect(tree.nodes).toEqual([]);
    });
  });

  describe("addStartNode", () => {
    it("should add a start node to empty tree", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN, "Starting position");

      expect(tree.nodes).toHaveLength(1);
      expect(tree.nodes[0].startingFEN).toBe(standardStartingFEN);
      expect(tree.nodes[0].notes).toBe("Starting position");
      expect(tree.nodes[0].children).toEqual([]);
    });

    it("should add multiple start nodes", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN, "Game 1");
      tree = addStartNode(
        tree,
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
        "After 1.e4",
      );

      expect(tree.nodes).toHaveLength(2);
      expect(tree.nodes[1].notes).toBe("After 1.e4");
    });

    it("should handle empty notes", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN);

      expect(tree.nodes[0].notes).toBe("");
    });
  });

  describe("addMoveNode", () => {
    it("should add a move to a start node", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN, "Starting position");

      const afterE4FEN =
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      tree = addMoveNode(tree, standardStartingFEN, "e4", afterE4FEN);

      expect(tree.nodes[0].children).toHaveLength(1);
      expect(tree.nodes[0].children[0].move).toBe("e4");
      expect(tree.nodes[0].children[0].fen).toBe(afterE4FEN);
    });

    it("should add multiple moves in sequence", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN, "Ruy Lopez opening");

      const afterE4FEN =
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      const afterE5FEN =
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";
      const afterNf3FEN =
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";

      tree = addMoveNode(tree, standardStartingFEN, "e4", afterE4FEN);
      tree = addMoveNode(tree, afterE4FEN, "e5", afterE5FEN);
      tree = addMoveNode(tree, afterE5FEN, "Nf3", afterNf3FEN);

      expect(tree.nodes[0].children).toHaveLength(1);
      expect(tree.nodes[0].children[0].children).toHaveLength(1);
      expect(tree.nodes[0].children[0].children[0].children).toHaveLength(1);
      expect(tree.nodes[0].children[0].children[0].children[0].move).toBe(
        "Nf3",
      );
    });

    it("should add variations (multiple children)", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN, "King's pawn openings");

      const afterE4FEN =
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      const afterE5FEN =
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";
      const afterC5FEN =
        "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2";

      tree = addMoveNode(tree, standardStartingFEN, "e4", afterE4FEN);
      tree = addMoveNode(tree, afterE4FEN, "e5", afterE5FEN);
      tree = addMoveNode(tree, afterE4FEN, "c5", afterC5FEN);

      expect(tree.nodes[0].children[0].children).toHaveLength(2);
      expect(tree.nodes[0].children[0].children[0].move).toBe("e5");
      expect(tree.nodes[0].children[0].children[1].move).toBe("c5");
    });

    it("should throw error when parent FEN not found", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN);

      expect(() => {
        addMoveNode(tree, "invalid-fen", "e4", "some-fen");
      }).toThrow("Parent position with FEN invalid-fen not found in tree");
    });
  });

  describe("updateNotes", () => {
    it("should update notes for existing start node", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN, "Original notes");
      tree = updateNotes(tree, standardStartingFEN, "Updated notes");

      expect(tree.nodes[0].notes).toBe("Updated notes");
    });

    it("should throw error when start node not found", () => {
      const tree = createMoveTree();

      expect(() => {
        updateNotes(tree, "invalid-fen", "New notes");
      }).toThrow("StartNode with FEN invalid-fen not found");
    });
  });

  describe("JSON serialization", () => {
    it("should convert tree to JSON and back", () => {
      const headers = {
        Event: "Test Tournament",
        White: "Player1",
        Black: "Player2",
      };
      let tree = createMoveTree("Test Game", headers);
      tree = addStartNode(tree, standardStartingFEN, "Test game");

      const afterE4FEN =
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      tree = addMoveNode(tree, standardStartingFEN, "e4", afterE4FEN);

      const json = moveTreeToJSON(tree);
      const restoredTree = moveTreeFromJSON(json);

      expect(restoredTree.name).toBe("Test Game");
      expect(restoredTree.headers).toEqual(headers);
      expect(restoredTree.nodes).toHaveLength(1);
      expect(restoredTree.nodes[0].startingFEN).toBe(standardStartingFEN);
      expect(restoredTree.nodes[0].notes).toBe("Test game");
      expect(restoredTree.nodes[0].children).toHaveLength(1);
      expect(restoredTree.nodes[0].children[0].move).toBe("e4");
    });

    it("should handle empty children in JSON", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN, "Empty tree");

      const json = moveTreeToJSON(tree);
      expect(json.nodes[0].children).toEqual([]);

      const restoredTree = moveTreeFromJSON(json);
      expect(restoredTree.nodes[0].children).toEqual([]);
    });
  });

  describe("generateMoveTreeFromPGN", () => {
    it("should parse simple Ruy Lopez opening", () => {
      const pgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5";
      const tree = generateMoveTreeFromPGN(pgn);

      expect(tree.nodes).toHaveLength(1);
      expect(tree.nodes[0].startingFEN).toBe(standardStartingFEN);
      // Accept both pgn-parser path and fallback path

      // Should have at least the first move
      expect(tree.nodes[0].children).toHaveLength(1);
      expect(tree.nodes[0].children[0].move).toBe("e4");
    });

    it("should parse Ruy Lopez with annotations", () => {
      const pgn = "1. e4! e5 2. Nf3?! Nc6 3. Bb5+ {Spanish Opening}";
      const tree = generateMoveTreeFromPGN(pgn);

      expect(tree.nodes).toHaveLength(1);
      expect(tree.nodes[0].children[0].move).toBe("e4!");
    });

    it("should parse PGN headers correctly", () => {
      const pgn = `[Event "World Championship"]
[Site "London"]
[Date "2023.05.15"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0`;

      const tree = generateMoveTreeFromPGN(pgn, undefined, "Test Championship");

      expect(tree.name).toBe("Test Championship");
      expect(tree.headers).toEqual({
        Event: "World Championship",
        Site: "London",
        Date: "2023.05.15",
        Round: "1",
        White: "Player1",
        Black: "Player2",
        Result: "1-0",
      });

      expect(tree.nodes[0].notes).toContain("White: Player1");
      expect(tree.nodes[0].notes).toContain("Black: Player2");
      expect(tree.nodes[0].notes).toContain("Event: World Championship");
      expect(tree.nodes[0].notes).toContain("Date: 2023.05.15");
    });

    it("should handle PGN with result", () => {
      const pgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0";
      const tree = generateMoveTreeFromPGN(pgn);

      expect(tree.nodes).toHaveLength(1);
      // Should not include the result as a move
      const mainLine = getMainLine(tree);
      expect(mainLine).not.toContain("1-0");
    });

    it("should parse Ruy Lopez Spanish Torture", () => {
      const pgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7";
      const tree = generateMoveTreeFromPGN(pgn);

      expect(tree.nodes).toHaveLength(1);
      expect(countMoves(tree)).toBeGreaterThan(0);
    });

    it("should handle empty PGN", () => {
      const pgn = "";
      const tree = generateMoveTreeFromPGN(pgn);

      expect(tree.nodes).toHaveLength(1);
      expect(tree.nodes[0].notes).toBe("Empty PGN");
      expect(tree.nodes[0].children).toHaveLength(0);
    });
  });

  describe("getMainLine", () => {
    it("should return empty array for empty tree", () => {
      const tree = createMoveTree();
      expect(getMainLine(tree)).toEqual([]);
    });

    it("should return main line moves", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN);

      const fens = [
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
      ];

      tree = addMoveNode(tree, standardStartingFEN, "e4", fens[0]);
      tree = addMoveNode(tree, fens[0], "e5", fens[1]);
      tree = addMoveNode(tree, fens[1], "Nf3", fens[2]);

      const mainLine = getMainLine(tree);
      expect(mainLine).toEqual(["e4", "e5", "Nf3"]);
    });
  });

  describe("countMoves", () => {
    it("should count zero moves for empty tree", () => {
      const tree = createMoveTree();
      expect(countMoves(tree)).toBe(0);
    });

    it("should count moves in linear sequence", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN);

      const fens = ["fen1", "fen2", "fen3"];

      tree = addMoveNode(tree, standardStartingFEN, "e4", fens[0]);
      tree = addMoveNode(tree, fens[0], "e5", fens[1]);
      tree = addMoveNode(tree, fens[1], "Nf3", fens[2]);

      expect(countMoves(tree)).toBe(3);
    });

    it("should count moves with variations", () => {
      let tree = createMoveTree();
      tree = addStartNode(tree, standardStartingFEN);

      const fens = ["fen1", "fen2a", "fen2b", "fen3"];

      tree = addMoveNode(tree, standardStartingFEN, "e4", fens[0]);
      tree = addMoveNode(tree, fens[0], "e5", fens[1]);
      tree = addMoveNode(tree, fens[0], "c5", fens[2]);
      tree = addMoveNode(tree, fens[1], "Nf3", fens[3]);

      expect(countMoves(tree)).toBe(4); // e4, e5, c5, Nf3
    });
  });

  describe("Real Ruy Lopez Examples", () => {
    it("should handle classical Ruy Lopez", () => {
      const pgn =
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6";
      const tree = generateMoveTreeFromPGN(pgn);

      expect(tree.nodes).toHaveLength(1);
      expect(countMoves(tree)).toBeGreaterThan(10);

      const mainLine = getMainLine(tree);
      expect(mainLine[0]).toBe("e4");
      expect(mainLine[1]).toBe("e5");
      expect(mainLine[2]).toBe("Nf3");
    });

    it("should handle Ruy Lopez Exchange", () => {
      const pgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. d3";
      const tree = generateMoveTreeFromPGN(pgn);

      expect(tree.nodes).toHaveLength(1);
      expect(countMoves(tree)).toBeGreaterThan(7);
    });

    it("should handle Ruy Lopez Berlin Defense", () => {
      const pgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4";
      const tree = generateMoveTreeFromPGN(pgn);

      expect(tree.nodes).toHaveLength(1);
      expect(countMoves(tree)).toBeGreaterThan(7);

      // Verify JSON serialization works with this tree
      const json = moveTreeToJSON(tree);
      const restored = moveTreeFromJSON(json);
      expect(countMoves(restored)).toBe(countMoves(tree));
    });
  });

  describe("editMoveTreeName", () => {
    it("should update the name of a move tree", () => {
      let tree = createMoveTree("Original Name");
      tree = addStartNode(tree, standardStartingFEN, "Test position");

      expect(tree.name).toBe("Original Name");

      const updatedTree = editMoveTreeName(tree, "New Name");

      expect(updatedTree.name).toBe("New Name");
      expect(updatedTree.nodes).toEqual(tree.nodes);
      expect(tree.name).toBe("Original Name"); // Original tree unchanged
    });

    it("should handle empty string names", () => {
      let tree = createMoveTree("Test");
      tree = editMoveTreeName(tree, "");

      expect(tree.name).toBe("");
    });

    it("should preserve all tree data when changing name", () => {
      let tree = createMoveTree("Chess Game");
      tree = addStartNode(tree, standardStartingFEN, "Starting position");

      const afterE4FEN =
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      tree = addMoveNode(tree, standardStartingFEN, "e4", afterE4FEN);

      const originalMoveCount = countMoves(tree);
      const updatedTree = editMoveTreeName(tree, "Updated Chess Game");

      expect(updatedTree.name).toBe("Updated Chess Game");
      expect(countMoves(updatedTree)).toBe(originalMoveCount);
      expect(updatedTree.nodes[0].notes).toBe("Starting position");
      expect(updatedTree.nodes[0].children[0].move).toBe("e4");
    });
  });
});
