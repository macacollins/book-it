import React from "react";
import { getChessableURL } from "../integrations/getChessableURL";

interface ChessableLinkProps {
  fen: string;
}

export const ChessableLink: React.FC<ChessableLinkProps> = ({ fen }) => (
  <a
    href={getChessableURL(fen)}
    target="_blank"
    rel="noopener noreferrer"
    className="p-button p-button-sm p-button-outlined"
  >
    Chessable
  </a>
);
