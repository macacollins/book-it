import Repertoire from "./Repertoire";

export interface ChannelConfiguration {
  name: string;
  lichessPlayerIDs: string[];
  fens: string[];
  repertoire?: Repertoire;
}
