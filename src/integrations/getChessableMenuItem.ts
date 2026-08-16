import { MenuItem } from "primereact/menuitem";
import { getChessableURL } from "./getChessableURL";

export function getChessableMenuItem(fen: string): MenuItem {
  // console.log("Copying chessable link for fen:", fen);
  return {
    label: "Chessable",
    icon: "bi bi-book",
    command: () => {
      // window.open(getChessableURL(fen), "_blank", "noopener,noreferrer");
    
      // Instead, let's copy to the clipboard
      const url = getChessableURL(fen);
      navigator.clipboard.writeText(url).then(() => {
        // alert("Chessable URL copied to clipboard!");
      }).catch((err) => {
        console.error("Failed to copy URL: ", err);
        alert("Failed to copy Chessable URL. Please try again.");
      });
    },
  
  };
}
