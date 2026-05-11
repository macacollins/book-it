import { Chess } from "chess.js";
import { GradualRepertoire } from "../database/types";

function compareMoveLines(left: string[], right: string[]): number {
  const leftKey = left.join(" ");
  const rightKey = right.join(" ");
  return leftKey.localeCompare(rightKey);
}

function isLineSubsetOf(line: string[], candidate: string[]): boolean {
  if (line.length > candidate.length) {
    return false;
  }
  return line.every((move, index) => candidate[index] === move);
}

function condenseRepertoireLines(lines: string[][]): string[][] {
  const sortedLines = [...lines].sort(compareMoveLines);

  return sortedLines.filter((line, index) => {
    return !sortedLines.some((candidate, candidateIndex) => {
      if (candidateIndex === index || candidate.length === line.length) {
        return false;
      }
      return isLineSubsetOf(line, candidate);
    });
  });
}

export function gradualRepertoireToPGNString(repertoire: GradualRepertoire): string {
  const startingMoves = repertoire.startingMoves;
  const condensedLines = condenseRepertoireLines(repertoire.lines);

  const pgnLines = condensedLines
    .map((lineMoves) => {
      const allMoves = [...startingMoves, ...lineMoves];

      const chess = new Chess();
      const moveNumber =
        Math.floor(
          (chess.moveNumber() * 2 - (chess.turn() === "w" ? 1 : 0)) / 2,
        ) + 1;
      let linePgn = "";
      let currentMoveNum = moveNumber;
      let isWhiteTurn = chess.turn() === "w";

      // Build and validate the PGN
      for (const san of allMoves) {
        if (isWhiteTurn) {
          linePgn += `${currentMoveNum}. ${san} `;
        } else {
          if (linePgn === "") {
            linePgn += `${currentMoveNum}... ${san} `;
          } else {
            linePgn += `${san} `;
          }
          currentMoveNum++;
        }

        let moveResult;
        try {
          // Validate that this move can be played
          moveResult = chess.move(san);
        } catch {
          return null;
        }

        if (!moveResult) {
          // Invalid move, return null to filter out
          return null;
        }
        isWhiteTurn = !isWhiteTurn;
      }

      // Add the asterisk with appropriate move number
      let finalPgn = linePgn.trim();
      if (isWhiteTurn) {
        // Last move was by black, so it's white's turn next
        finalPgn += ` *`;
      } else {
        // Last move was by white, so it's black's turn next
        finalPgn += ` *`;
      }

      return finalPgn;
    })
    .filter((pgn): pgn is string => pgn !== null);

  return pgnLines.join("\n");
}
