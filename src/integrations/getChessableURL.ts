export function getChessableURL(fen: string): string {
  return `https://www.chessable.com/courses/fen/${encodeURIComponent(fen)}`;
}
