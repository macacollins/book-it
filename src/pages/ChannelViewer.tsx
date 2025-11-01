import { useEffect, useState } from "react";

import { useParams } from "react-router";

import { retrieveChannelByName } from "./channel-utils";
import { Channel } from "../types/Channel";

import { ProgressSpinner } from "primereact/progressspinner";

import { useNavigate } from "react-router";
import MultipleFENTV from "./MultipleFENTV";

export default function ChannelViewer() {
  const [channel, setChannel] = useState<Channel | undefined>();

  const { channelName } = useParams();

  const navigate = useNavigate();

  useEffect(() => {
    const maybeChannel = retrieveChannelByName(channelName || "");

    if (maybeChannel) {
      setChannel(maybeChannel);
    } else {
      navigate("/book-it/channels");
    }
  }, []);

  if (channel) {
    return (
      <MultipleFENTV
        fens={channel.seed_fens}
        closeHandler={() => {
          navigate("/book-it/channels");
        }}
        startInverted={channel.invert}
      />
    );
  } else {
    return <ProgressSpinner />;
  }
}
