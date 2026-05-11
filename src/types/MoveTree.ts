import pgnParser, { ParsedPGN } from "pgn-parser";

/**
 * Represents a chess move tree structure for storing variations and analysis
 */

export interface MoveNode {
  move: string; // The move in algebraic notation (e.g., "e4", "Nf3")
  fen: string; // The FEN position after this move
  notes: string;
  children: MoveNode[]; // Subsequent moves/variations
}

export interface StartNode {
  startingFEN: string; // The starting position FEN
  notes: string; // Notes about this starting position
  children: MoveNode[]; // The main line and variations from this position
}

export interface MoveTree {
  name: string; // Name of the move tree
  nodes: StartNode[]; // Collection of starting positions
  headers: Record<string, string>; // PGN headers if applicable
}

/**
 * Compact JSON representation type for serialization
 */
export type MoveTreeJSON = {
  name: string;
  headers: Record<string, string>;
  nodes: Array<{
    startingFEN: string;
    notes: string;
    children: Array<{
      move: string;
      fen: string;
      children?: any[]; // Recursive structure
    }>;
  }>;
};

/**
 * Create an empty MoveTree
 */
export const createMoveTree = (
  name: string = "",
  headers: Record<string, string> = {},
): MoveTree => ({
  name,
  headers,
  nodes: [],
});

/**
 * Add a new StartNode to an existing MoveTree
 */
export const addStartNode = (
  moveTree: MoveTree,
  startingFEN: string,
  notes: string = "",
): MoveTree => {
  const newStartNode: StartNode = {
    startingFEN,
    notes,
    children: [],
  };

  return {
    ...moveTree,
    nodes: [...moveTree.nodes, newStartNode],
  };
};

/**
 * Find a StartNode by FEN
 */
export const findStartNode = (
  moveTree: MoveTree,
  fen: string,
): StartNode | null => {
  return moveTree.nodes.find((node) => node.startingFEN === fen) || null;
};

/**
 * Find a MoveNode by FEN in a tree of moves
 */
export const findMoveNode = (
  nodes: MoveNode[],
  targetFEN: string,
): MoveNode | null => {
  for (const node of nodes) {
    if (node.fen === targetFEN) {
      return node;
    }
    const found = findMoveNode(node.children, targetFEN);
    if (found) {
      return found;
    }
  }
  return null;
};

/**
 * Find any node (Start or Move) by FEN
 */
export const findNodeByFEN = (
  moveTree: MoveTree,
  fen: string,
): { type: "start" | "move"; node: StartNode | MoveNode } | null => {
  // Check start nodes
  const startNode = findStartNode(moveTree, fen);
  if (startNode) {
    return { type: "start", node: startNode };
  }

  // Check move nodes
  for (const startNode of moveTree.nodes) {
    const moveNode = findMoveNode(startNode.children, fen);
    if (moveNode) {
      return { type: "move", node: moveNode };
    }
  }

  return null;
};

/**
 * Add a MoveNode to an existing MoveTree
 * Finds the parent position by FEN and adds the move as a child
 */
export const addMoveNode = (
  moveTree: MoveTree,
  parentFEN: string,
  move: string,
  resultingFEN: string,
  notes: string = "",
): MoveTree => {
  if (findNodeByFEN(moveTree, resultingFEN)) {
    return moveTree;
  }

  const newMoveNode: MoveNode = {
    move,
    fen: resultingFEN,
    children: [],
    notes,
  };

  // Create a deep copy of the tree
  const newTree: MoveTree = {
    name: moveTree.name,
    headers: moveTree.headers,
    nodes: moveTree.nodes.map((startNode) => ({
      ...startNode,
      children: [...startNode.children],
    })),
  };

  // Find the parent node
  const parentResult = findNodeByFEN(newTree, parentFEN);

  if (!parentResult) {
    throw new Error(`Parent position with FEN ${parentFEN} not found in tree`);
  }

  // Add the move to the appropriate parent
  if (parentResult.type === "start") {
    (parentResult.node as StartNode).children.push(newMoveNode);
  } else {
    (parentResult.node as MoveNode).children.push(newMoveNode);
  }

  return newTree;
};

/**
 * Convert MoveTree to compact JSON representation
 */
export const moveTreeToJSON = (moveTree: MoveTree): MoveTreeJSON => {
  const convertMoveNode = (node: MoveNode): any => ({
    move: node.move,
    fen: node.fen,
    children:
      node.children.length > 0 ? node.children.map(convertMoveNode) : undefined,
  });

  return {
    name: moveTree.name,
    headers: moveTree.headers,
    nodes: moveTree.nodes.map((startNode) => ({
      startingFEN: startNode.startingFEN,
      notes: startNode.notes,
      children: startNode.children.map(convertMoveNode),
    })),
  };
};

/**
 * Convert compact JSON back to MoveTree
 */
export const moveTreeFromJSON = (json: MoveTreeJSON): MoveTree => {
  const convertMoveNode = (nodeData: any): MoveNode => ({
    move: nodeData.move,
    fen: nodeData.fen,
    children: nodeData.children ? nodeData.children.map(convertMoveNode) : [],
    notes: nodeData.notes || "",
  });

  return {
    name: json.name,
    headers: json.headers || {},
    nodes: json.nodes.map((startNodeData) => ({
      startingFEN: startNodeData.startingFEN,
      notes: startNodeData.notes,
      children: startNodeData.children.map(convertMoveNode),
    })),
  };
};

/**
 * Generate a MoveTree from PGN notation using the pgn-parser library
 */
export const generateMoveTreeFromPGN = (
  pgn: string,
  startingFEN: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  treeName: string = "",
): MoveTree => {
  let moveTree: MoveTree;

  // Handle empty PGN early
  if (!pgn || pgn.trim() === "") {
    moveTree = createMoveTree(treeName);
    return addStartNode(moveTree, startingFEN, "Empty PGN");
  }

  try {
    // Try to format the PGN properly if it's just moves
    let formattedPGN = pgn.trim();

    // If PGN doesn't have headers, add minimal headers for pgn-parser
    if (!formattedPGN.includes("[Event") && !formattedPGN.includes("[White")) {
      formattedPGN = `[Event "Moves"]\n\n${formattedPGN} *`;
    }

    // Parse the PGN using pgn-parser
    const parsed: ParsedPGN[] = pgnParser.parse(formattedPGN);

    if (parsed && parsed.length > 0) {
      const game = parsed[0];

      // Extract headers from parsed PGN and convert from Header[] to Record<string, string>
      const headers: Record<string, string> = {};
      if (game.headers && Array.isArray(game.headers)) {
        game.headers.forEach((header) => {
          headers[header.name] = header.value;
        });
      }
      moveTree = createMoveTree(treeName, headers);

      // Extract game info for notes
      const gameInfo = [];
      if (headers.White) gameInfo.push(`White: ${headers.White}`);
      if (headers.Black) gameInfo.push(`Black: ${headers.Black}`);
      if (headers.Event) gameInfo.push(`Event: ${headers.Event}`);
      if (headers.Date) gameInfo.push(`Date: ${headers.Date}`);

      const notes = gameInfo.length > 0 ? gameInfo.join(", ") : "PGN Game";

      // Add the starting position
      moveTree = addStartNode(moveTree, startingFEN, notes);

      if (game.moves && game.moves.length > 0) {
        // Process moves from pgn-parser output
        const processParsedMoves = (
          moves: any[],
          parentFEN: string,
          currentColor: "w" | "b",
          moveNumber: number,
          halfMoveCount: number,
        ): void => {
          let currentFEN = parentFEN;
          let color = currentColor;
          let moveNum = moveNumber;
          let halfMove = halfMoveCount;

          for (const moveItem of moves) {
            let move: string;

            if (typeof moveItem === "string") {
              move = moveItem;
            } else if (
              moveItem &&
              typeof moveItem === "object" &&
              moveItem.move
            ) {
              move = moveItem.move;
            } else {
              continue;
            }

            // Generate FEN for the resulting position
            const fenParts = currentFEN.split(" ");
            const newFEN = `${fenParts[0]} ${color === "w" ? "b" : "w"} ${fenParts[2]} ${fenParts[3]} ${halfMove} ${color === "b" ? moveNum + 1 : moveNum}`;

            try {
              moveTree = addMoveNode(moveTree, currentFEN, move, newFEN);
              currentFEN = newFEN;

              // Update move tracking
              if (color === "w") {
                color = "b";
              } else {
                color = "w";
                moveNum++;
              }
              halfMove++;
            } catch (error) {
              console.warn(`Could not add move ${move}: ${error}`);
              break;
            }
          }
        };

        processParsedMoves(game.moves, startingFEN, "w", 1, 0);
        return moveTree;
      }

      return moveTree;
    }
  } catch (error) {
    // pgn-parser failed, fall back to simple parsing
    console.warn("pgn-parser failed, using fallback parser:", error);
  }

  return createMoveTree(treeName);
};

/**
 * Get all moves in the main line of a MoveTree
 */
export const getMainLine = (moveTree: MoveTree): string[] => {
  if (moveTree.nodes.length === 0) return [];

  const mainLine: string[] = [];
  let current = moveTree.nodes[0].children[0]; // Start with first move of first variation

  while (current) {
    mainLine.push(current.move);
    current = current.children[0]; // Follow the main line (first child)
  }

  return mainLine;
};

/**
 * Count total number of moves in the tree
 */
export const countMoves = (moveTree: MoveTree): number => {
  const countInNodes = (nodes: MoveNode[]): number => {
    return nodes.reduce((count, node) => {
      return count + 1 + countInNodes(node.children);
    }, 0);
  };

  return moveTree.nodes.reduce((total, startNode) => {
    return total + countInNodes(startNode.children);
  }, 0);
};

/**
 * Edit the name of a MoveTree
 */
export const editMoveTreeName = (
  moveTree: MoveTree,
  newName: string,
): MoveTree => {
  return {
    ...moveTree,
    name: newName,
  };
};
