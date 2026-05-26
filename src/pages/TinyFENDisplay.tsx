import ChessBoard from "../components/ChessBoard";

export function TinyFENDisplay({
  fen,
  invert = false,
  extraText = ""
}: {
  fen: string;
  invert?: boolean;
  extraText?: string;
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
        name={extraText + sanitized}
        game_url={sanitized}
        draggable={true}
        size="168px"
      ></ChessBoard>
    </div>
  );
}
