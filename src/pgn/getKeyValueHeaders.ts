import { ParsedPGN } from "pgn-parser";

export default function getKeyValueHeaders(
  game: ParsedPGN,
): Record<string, string> {
  if (!game) {
    return {};
  }
  let newValue: Record<string, string> = {};

  return newValue;
}
