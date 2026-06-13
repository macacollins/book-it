import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

interface DeletePending {
  san: string;
  count: number;
}

interface DeleteRepertoireLinesDialogProps {
  deletePending: DeletePending | null;
  onHide: () => void;
  onConfirm: () => void;
}

export const DeleteRepertoireLinesDialog: React.FC<DeleteRepertoireLinesDialogProps> = ({
  deletePending,
  onHide,
  onConfirm,
}) => {
  return (
    <Dialog
      header="Delete Repertoire Lines"
      visible={deletePending !== null}
      style={{ width: "22rem" }}
      onHide={onHide}
      modal
      footer={
        <div className="flex gap-2 justify-content-end">
          <Button
            label="Cancel"
            className="p-button-text"
            onClick={onHide}
          />
          <Button
            label="Confirm"
            className="p-button-danger"
            onClick={onConfirm}
          />
        </div>
      }
    >
      <p>
        This will delete{" "}
        <strong>{deletePending?.count}</strong>{" "}
        line{deletePending?.count !== 1 ? "s" : ""} from your repertoire.
        Are you sure?
      </p>
    </Dialog>
  );
};
