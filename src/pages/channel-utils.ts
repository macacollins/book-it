import { ChannelConfiguration } from "../types/ChannelConfiguration";
import { Channel } from "../types/Channel";

export const channelifyName = (input: string) => {
    return input.replaceAll(/ /g, '-').replaceAll(/[^\w-]/g, '').toLowerCase();
}

export const retrieveChannelByName = (channelName: string) => {
    const channels = retrieveChannels();

    return getMatchingChannel(channelName, channels || []);
}

export const getMatchingChannel = (channelifiedName: string, items: Channel[]) => {
    for (const channel of items) {
        if (channelifyName(channel.name) === channelifiedName) {
            return channel;
        }
    }
}

const channelStorage = "CHANNELS";

export function saveAllChannels(channelBlob: Channel[]) {
  localStorage.setItem(channelStorage, JSON.stringify(channelBlob));
}

export function retrieveChannels(): Channel[] | undefined {
  const currentValue = localStorage.getItem(channelStorage);

  if (currentValue) {
    return JSON.parse(currentValue);
  }
}
