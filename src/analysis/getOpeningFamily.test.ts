import pgnParser from "pgn-parser";

import getOpeningFamily from "./getOpeningFamily";

test("Result length is correct", () => {
  let greenArrows = getOpeningFamily(
    "Unkawefnown",
    pgnParser.parse("1. d4 f5 *")[0],
  );

  expect(greenArrows).toEqual("Dutch Defense");
});
