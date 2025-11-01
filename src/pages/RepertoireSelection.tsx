import { Button } from "primereact/button";

import { useNavigate } from "react-router";

import { channelifyName } from "./channel-utils";

interface RepertoireSelectionProps {
  repertoireList: string[];
}

function ConfigPage({ repertoireList }: RepertoireSelectionProps) {
  const navigate = useNavigate();

  const buttons = repertoireList.map((repertoireName) => {
    return (
      <Button
        onClick={() =>
          navigate("/book-it/repertoires/" + channelifyName(repertoireName))
        }
      >
        {repertoireName}
      </Button>
    );
  });

  return (
    <>
      <h2>All Repertoires</h2>
      <section className="flex gap-3 row-gap-3 flex-wrap flex-column">
        {buttons}
      </section>
    </>
  );
}

export default ConfigPage;
