import { Button } from "primereact/button";

import { Accordion } from "primereact/accordion";

import { AccordionTab } from "primereact/accordion";

import { TinyFENDisplay } from "./TinyFENDisplay";
import { useNavigate } from "react-router";

import { channelifyName, retrieveChannels } from "./channel-utils";

export default function ChannelManagement() {
  const channels = retrieveChannels() || [];

  const navigate = useNavigate();

  const channelDisplays = channels.map((channel) => {
    return (
      <AccordionTab
        header={
          <header className="flex align-items-center gap-2 justify-content-left">
            {channel.name}{" "}
            <Button onClick={() => navigate(channelifyName(channel.name))}>
              Play
            </Button>
          </header>
        }
      >
        <section className="fens grid row-gap-3 align-items-center justify-content-center">
          {channel.seed_fens.map((fen) => (
            <TinyFENDisplay fen={fen} invert={channel.invert} />
          ))}
        </section>
      </AccordionTab>
    );
  });

  return (
    <>
      <h1>Channels</h1>
      <Button
        label="New Channel"
        onClick={() => navigate("/book-it/add-channel")}
      ></Button>
      <Accordion>{channelDisplays}</Accordion>
    </>
  );
}
