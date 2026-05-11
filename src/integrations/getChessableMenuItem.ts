import { MenuItem } from "primereact/menuitem";
import { getChessableURL } from "./getChessableURL";

export function getChessableMenuItem(fen: string): MenuItem {
  return {
    label: "Chessable",
    icon: "bi bi-book",
    command: () => {
      window.open(getChessableURL(fen), "_blank", "noopener,noreferrer");
    },
  };
}
