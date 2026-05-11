import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

interface PromotionDialogProps {
  visible: boolean;
  onSelect: (piece: "q" | "r" | "b" | "n") => void;
  onCancel: () => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  visible,
  onSelect,
  onCancel,
}) => {
  const pieces = [
    { label: "Queen", value: "q" as const, icon: "♕" },
    { label: "Rook", value: "r" as const, icon: "♖" },
    { label: "Bishop", value: "b" as const, icon: "♗" },
    { label: "Knight", value: "n" as const, icon: "♘" },
  ];

  return (
    <Dialog
      header="Promote Pawn"
      visible={visible}
      style={{ width: "350px" }}
      onHide={onCancel}
      modal
      closable={false}
    >
      <div className="flex flex-column gap-2">
        <p className="mb-2">Choose a piece to promote your pawn to:</p>
        <div className="grid">
          {pieces.map((piece) => (
            <div key={piece.value} className="col-6">
              <Button
                label={`${piece.icon} ${piece.label}`}
                onClick={() => onSelect(piece.value)}
                className="w-full"
                style={{ fontSize: "1.2rem" }}
              />
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
};
