import { GradualRepertoire, UploadedPGN } from "../database/types";
import { gradualRepertoireToPGNString } from "./gradualRepertoireToPGNString";

export function gradualRepertoireToSavedPGN(repertoire: GradualRepertoire): UploadedPGN {
  return {
    id: crypto.randomUUID(),
    filename: `${repertoire.name}.pgn`,
    content: gradualRepertoireToPGNString(repertoire),
    type: "repertoire",
  };
}
