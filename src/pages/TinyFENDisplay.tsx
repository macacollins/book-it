import ChessBoard from "../components/ChessBoard";

export function TinyFENDisplay({
  fen,
  invert = false,
}: {
  fen: string;
  invert?: boolean;
}) {
  const madeMoveRef = { current: true };

  const sanitized = fen.replace(/[^a-zA-Z0-9]/gi, "");

  return (
    <div className="">
      <ChessBoard
        fen={fen}
        moves={[]}
        invert={invert}
        madeMoveRef={madeMoveRef}
        name={sanitized}
        game_url={sanitized}
        draggable={true}
        size="168px"
      ></ChessBoard>
    </div>
  );
}
