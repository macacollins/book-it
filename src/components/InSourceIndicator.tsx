import React from "react";
import { useSourceMovesStore } from "./useSourceMovesStore";

interface InSourceIndicatorProps {
  /** The current board FEN (position being viewed) */
  fen: string;
  /** The SAN move to check against the source repertoire */
  san: string;
}

export const InSourceIndicator: React.FC<InSourceIndicatorProps> = ({
  fen,
  san,
}) => {
  const sourceMoves = useSourceMovesStore(
    (state) => state.sourceMovesFromFen[fen],
  );

  if (!sourceMoves) return <span>-</span>;
  return <span>{sourceMoves.includes(san) ? "Y" : "N"}</span>;
};
