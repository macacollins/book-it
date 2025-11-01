import pgnParser, { ParsedPGN } from "pgn-parser";
import findPGN from "../analysis/findPGN";
import { Chess } from "chess.js";

const trace = false;

export default function parseComments(
  input: string,
  game: ParsedPGN,
): CommentNode[] {
  const fenLiterals = getFEN(input);

  let finalList: CommentNode[] = [];

  let lastFEN: string | undefined = undefined;

  for (const node of fenLiterals) {
    if (node.type === "FEN") {
      lastFEN = node.fen;
    }

    if (node.type === "Unprocessed") {
      const pgnSplit = findPGN(node.text);

      const pgnSplitNodes = [];

      if (!pgnSplit.length) {
        pgnSplitNodes.push(node);
      }

      let remainingText = node.text;

      for (const pgnFragment of pgnSplit) {
        if (!remainingText) {
          //console.log("Remaining text is empty or null. Returning.");
          break;
        }

        if (trace) console.log("Doing pgn fragment", pgnFragment);

        let parsedPGN: ParsedPGN[] = [];

        try {
          parsedPGN = pgnParser.parse(pgnFragment + " *");
        } catch (e: any) {
          if (trace) console.log("Failed to parse ", pgnFragment, e);
        }

        if (parsedPGN.length) {
          let chess = new Chess();

          let [beforeText, afterText] = remainingText.split(pgnFragment);

          if (trace)
            console.log(
              "Remaining text",
              remainingText,
              "before",
              beforeText,
              "after",
              afterText,
            );

          remainingText = afterText;

          // A bit of a hack--this only works if the pgn fragments are in order
          const beforeTextNode: CommentNode = {
            type: "Text",
            text: beforeText,
          };

          if (beforeText) {
            if (trace) console.log("PUSHING NODE ", beforeText);
            pgnSplitNodes.push(beforeTextNode);
          }

          if (trace) console.log("Got moves", parsedPGN[0].moves);
          let first = true;

          for (const move of parsedPGN[0].moves) {
            let newBranch = false;
            if (
              (first && !move.move_number) ||
              (move.move_number && move.move_number > 1)
            ) {
              newBranch = first;
              first = false;
            }

            first = false;

            // First, try to play it on the existing chess game.
            let text = move.move;
            if (chess.turn() === "w") {
              text = chess.moveNumber() + "." + move.move;
            }

            if (!newBranch) {
              if (trace) console.log("Going to try ", move.move);

              try {
                chess.move(move.move);

                const newCommentNode: CommentNode = {
                  type: "Move",
                  fen: chess.fen(),
                  text,
                };

                if (trace) console.log("Happy path");
                pgnSplitNodes.push(newCommentNode);
                continue;
              } catch (e: any) {
                if (trace)
                  console.log(
                    lastFEN,
                    "Unable to play move ",
                    move,
                    "on board\n\n",
                    chess.ascii(),
                  );
              }
            } else {
              console.log("New move number");
            }

            // Then, try to play it on the last FEN literal given.

            if (lastFEN) {
              const chessForNow = new Chess(lastFEN);
              if (trace)
                console.log("Trying lastFEN.\n\n", chessForNow.ascii());

              try {
                let text = "Default text";
                if (chess.turn() === "w") {
                  text = chess.moveNumber() + "..." + move.move;
                } else {
                  text = chess.moveNumber() + "." + move.move;
                }

                chessForNow.move(move.move);

                // here, it was a legal move.
                chess = chessForNow;
                if (trace)
                  console.log(
                    "Played move on board: ",
                    move.move,
                    "\n\n",
                    chessForNow.ascii(),
                  );

                const newCommentNode: CommentNode = {
                  type: "Move",
                  fen: chessForNow.fen(),
                  text,
                };

                pgnSplitNodes.push(newCommentNode);

                continue;
              } catch (e: any) {
                if (trace)
                  console.log(
                    "Unable to play move on last FEN either: " +
                      move.move +
                      "\n\n",
                    chess.fen(),
                  );
              }
            }

            // Then, try to play it on the current line

            if (trace)
              console.log(
                "Attempting to play ",
                move,
                "against line",
                game.moves,
              );

            let targetPlyNumber = -1;

            if (move.move_number) {
              targetPlyNumber = (move.move_number - 1) * 2;
            }

            if (pgnFragment.match(/^[0-9]+\.\.\./)) {
              console.log("Matched Black first move syntax", pgnFragment);
              targetPlyNumber = targetPlyNumber + 1;
            }

            const mainLine = new Chess();

            for (const lineMove of game.moves.slice(0, targetPlyNumber)) {
              if (trace) console.log("main line Playing ", lineMove);
              mainLine.move(lineMove.move);
            }

            if (trace) console.log("Target move ply is", targetPlyNumber);

            try {
              mainLine.move(move.move);

              // here, it was a legal move.
              chess = mainLine;
              if (trace)
                console.log(
                  "Played move on main line board: ",
                  move.move,
                  "\n\n",
                  mainLine.ascii(),
                );

              let text = "Default text";
              if (chess.turn() === "w") {
                text = move.move_number + "..." + move.move;
              } else {
                text = move.move_number + "." + move.move;
              }

              const newCommentNode: CommentNode = {
                type: "Move",
                fen: mainLine.fen(),
                text,
              };

              pgnSplitNodes.push(newCommentNode);

              continue;
            } catch (e: any) {
              if (trace)
                console.log(
                  "Unable to play move on main line board either: " +
                    move.move +
                    "\n\n",
                  chess.fen(),
                );
            }

            remainingText = afterText;
          }
        } else {
          if (trace) console.log("Passing through 2", node);
          pgnSplitNodes.push(node);
        }
      }

      if (remainingText && remainingText !== node.text) {
        console.log("Adding extra text node", remainingText);
        const remainingTextNode: CommentNode = {
          type: "Text",
          text: remainingText,
        };

        pgnSplitNodes.push(remainingTextNode);
      }

      if (trace) console.log("Concatting", pgnSplitNodes);
      finalList = finalList.concat(pgnSplitNodes);
    } else {
      if (trace) console.log("Passing through", node);
      finalList.push(node);
    }
  }

  // Convert all unprocessed nodes to text at the end.
  finalList = finalList.map((node) => {
    if (node.type === "Unprocessed") {
      return { ...node, type: "Text" };
    } else {
      return node;
    }
  });

  let returnList: CommentNode[] = [];

  for (const node of finalList) {
    if (node.type === "Text" || node.type === "Unprocessed") {
      returnList = returnList.concat(processBracket(node.text));
    } else {
      returnList.push(node);
    }
  }

  return returnList;
}

export interface CommentNode {
  type: "Move" | "Text" | "FEN" | "Unprocessed" | "Bold";
  fen?: string;
  text: string;
}

const getFEN: (comments: string) => CommentNode[] = (comments: string) => {
  const splitByFEN = comments.split(/@@StartFEN@@([^@]+)@@EndFen@@/i);

  if (trace) console.log("Splitbyfen", splitByFEN);
  // For each piece of
  const finalComments: CommentNode[] = splitByFEN.map(
    (splitItem: string, index: number) => {
      // TODO switch this to a FEN format check instead
      if (index % 2 === 1) {
        return {
          type: "FEN",
          fen: splitItem,
          text: "FEN",
        };
      } else {
        return {
          type: "Unprocessed",
          text: splitItem,
        };
      }
    },
  );

  if (trace) console.log("Final comments", finalComments);

  return finalComments;
};

const processBracket: (input: string) => CommentNode[] = (input: string) => {
  const splitByBracket = input.split(/@@StartBracket@@([^@]+)@@EndBracket@@/i);
  const finalComments: CommentNode[] = splitByBracket.map(
    (splitItem: string, index: number) => {
      // TODO switch this to a FEN format check instead
      if (index % 2 === 1) {
        return {
          type: "Bold",
          text: splitItem,
        };
      } else {
        return {
          type: "Text",
          text: splitItem,
        };
      }
    },
  );

  if (trace) console.log("Final comments", finalComments);

  return finalComments;
};

/* Temp save 

const trace = true;

export default function parseComments(input: string, game: ParsedPGN): CommentNode[] {

    const fenLiterals = getFEN(input);

    let finalList: CommentNode[] = [];

    let lastFEN: string | undefined = undefined;

    for (const node of fenLiterals) {
        if (node.type === "FEN") {
            lastFEN = node.fen;
        }

        if (node.type === "Unprocessed") {
            const pgnSplit = findPGN(node.text);

            const pgnSplitNodes = [];

            if (!pgnSplit.length) {
                pgnSplitNodes.push(node);
            }

            let remainingText = node.text;

            for (const pgnFragment of pgnSplit) {

                if (!remainingText) {
                    console.log("Remaining text is empty or null. Returning.");
                    break;
                }

                if (trace) console.log("Doing pgn fragment", pgnFragment);

                let parsedPGN: ParsedPGN[] = [];
                
                try {
                    parsedPGN = pgnParser.parse(pgnFragment + " *");
                } catch (e: any) {
                    if (trace) console.log("Failed to parse ", pgnFragment, e);
                }

                if (parsedPGN.length) {

                    let chess = new Chess();

                    let [beforeText, afterText] = remainingText.split(pgnFragment)


                    console.log("Remaining text", remainingText, "before", beforeText, "after", afterText);

                    remainingText = afterText;

                    // A bit of a hack--this only works if the pgn fragments are in order
                    const beforeTextNode: CommentNode = {
                        type: "Text",
                        text: beforeText
                    }

                    if (beforeText) {
                        console.log("PUSHING NODE ", beforeText);
                        pgnSplitNodes.push(beforeTextNode)
                    }

                    if (trace) console.log("Got moves", parsedPGN[0].moves);
                    let first = true;

                    for (const move of parsedPGN[0].moves) {

                        let newBranch = false;
                        if (first && !move.move_number || (move.move_number && move.move_number > 1)) {
                            newBranch = first;
                            first = false;
                        }

                        first = false;

                        // First, try to play it on the existing chess game.
                        let text = move.move;
                        if (chess.turn() === "w") {
                            text = chess.moveNumber() + "." + move.move
                        }

                        if (!newBranch) {
                            if (trace) console.log("Going to try ", move.move);

                            try {

                                chess.move(move.move);

                                const newCommentNode: CommentNode = {
                                    type: "Move",
                                    fen: chess.fen(),
                                    text
                                }

                                if (trace) console.log("Happy path");
                                pgnSplitNodes.push(newCommentNode)
                                continue;

                            } catch (e: any) {
                                if (trace) console.log(lastFEN, "Unable to play move ", move, "on board\n\n", chess.ascii())
                            }
                        } else {
                            console.log("New move number");
                        }


                        // Then, try to play it on the last FEN literal given.

                        if (lastFEN) {
                            const chessForNow = new Chess(lastFEN);
                            if (trace) console.log("Trying lastFEN.\n\n", chessForNow.ascii())

                            try {


                                let text = "Default text";
                                if (chess.turn() === "w") {
                                    text = chess.moveNumber() + "..." + move.move
                                } else {
                                    text = chess.moveNumber() + "." + move.move
                                }

                                chessForNow.move(move.move);

                                // here, it was a legal move. 
                                chess = chessForNow
                                if (trace) console.log("Played move on board: ", move.move, "\n\n", chessForNow.ascii())


                                const newCommentNode: CommentNode = {
                                    type: "Move",
                                    fen: chessForNow.fen(),
                                    text
                                }

                                pgnSplitNodes.push(newCommentNode);

                                continue;
                            } catch (e: any) {
                                if (trace) console.log("Unable to play move on last FEN either: " + move.move + "\n\n", chess.fen());
                            }
                        }

                        // Then, try to play it on the current line

                        if (trace) console.log("Attempting to play ", move, "against line", game.moves);

                        let targetPlyNumber = -1;

                        if (move.move_number) {
                            targetPlyNumber = (move.move_number - 1) * 2;
                        }

                        if (pgnFragment.match(/^[0-9]+\.\.\./)) {
                            console.log("Matched Black first move syntax", pgnFragment)
                            targetPlyNumber = targetPlyNumber + 1;
                        }

                        const mainLine = new Chess();

                        for (const lineMove of game.moves.slice(0, targetPlyNumber)) {
                            if (trace) console.log("main line Playing ", lineMove);
                            mainLine.move(lineMove.move)
                        }

                        if (trace) console.log("Target move ply is", targetPlyNumber);

                        try {


                            mainLine.move(move.move);

                            // here, it was a legal move. 
                            chess = mainLine
                            if (trace) console.log("Played move on main line board: ", move.move, "\n\n", mainLine.ascii())

                            let text = "Default text";
                            if (chess.turn() === "w") {
                                text = move.move_number + "..." + move.move
                            } else {
                                text = move.move_number + "." + move.move
                            }

                            const newCommentNode: CommentNode = {
                                type: "Move",
                                fen: mainLine.fen(),
                                text
                            }

                            pgnSplitNodes.push(newCommentNode);

                            continue;
                        } catch (e: any) {
                            if (trace) console.log("Unable to play move on main line board either: " + move.move + "\n\n", chess.fen());
                        }

                        remainingText = afterText;
                    }

                } else {
                    if (trace) console.log("Passing through 2", node)
                    pgnSplitNodes.push(node);
                }
            }

            if (remainingText && remainingText !== node.text) {

                console.log("Adding extra text node", remainingText);
                const remainingTextNode: CommentNode = {
                    type: "Text",
                    text: remainingText
                }

                pgnSplitNodes.push(remainingTextNode);
            }

            if (trace) console.log("Concatting", pgnSplitNodes);
            finalList = finalList.concat(pgnSplitNodes)
        } else {
            if (trace) console.log("Passing through", node)
            finalList.push(node);
        }
    }
    

    // Convert all unprocessed nodes to text at the end.
    finalList = finalList.map(node => {
        if (node.type === "Unprocessed") {
            return {... node, type: "Text"}
        } else {
            return node;
        }
    }) 

    return finalList;
}

export interface CommentNode {
    type: "Move" | "Text" | "FEN" | "Unprocessed"
    fen?: string
    text: string
}

const getFEN: (comments: string) => CommentNode[] = (comments: string) => {
    const splitByFEN = comments.split(/@@StartFEN@@([^@]+)@@EndFen@@/i);

    if (trace) console.log("Splitbyfen", splitByFEN);
    // For each piece of 
    const finalComments: CommentNode[] = splitByFEN.map((splitItem: string, index: number) => {
        // TODO switch this to a FEN format check instead
        if (index % 2 === 1) {
            return {
                type: "FEN",
                fen: splitItem,
                text: "FEN"
            }
        } else {
            return {
                type: "Unprocessed",
                text: splitItem
            }
        }
    });

    if (trace) console.log("Final comments", finalComments);

    return finalComments
}

*/
