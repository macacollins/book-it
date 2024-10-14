import { ParsedPGN } from "pgn-parser";
import getOpeningFamily from "./getOpeningFamily";

export function calculateOpeningFamily(
  headers: Record<string, string>,
  parsedPgn: ParsedPGN,
) {
  /*
    if (headers["Site"]?.indexOf("lichess") === -1) {
        console.log("Opening for chess.com");
    } else {
        console.log("opening for lichess");
    }
    */

  let openingName = "Not Found";

  try {
    const path = new URL(headers.ECOUrl).pathname;
    // Get the last path segment and replace hyphens with spaces
    let maybeOpeningName = path
      .split("/")
      ?.pop()
      ?.replace(/-/g, " ")
      .replace(/[0-9].*/g, "");
    if (maybeOpeningName) {
      openingName = maybeOpeningName;
    }
  } catch (e) {
    // return "";
  }

  return getOpeningFamily(openingName, parsedPgn);
}
