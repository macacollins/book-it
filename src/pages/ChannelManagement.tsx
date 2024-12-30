import Repertoire from "../types/Repertoire";

import { useState } from 'react';

import { Button } from 'primereact/button';

import { Accordion } from 'primereact/accordion';

import { AccordionTab } from "primereact/accordion";

import 'primeflex/primeflex.css';
import 'primeflex/themes/primeone-light.css'
import MultipleFENTV from "./MultipleFENTV";
import { Channel } from "../types/Channel";
import { TinyFENDisplay } from "./TinyFENDisplay";
import { ChannelForm } from "./ChannelForm";

export interface ChannelManagementProps {
    repertoire: Repertoire;
}

export default function ChannelManagement({repertoire}: ChannelManagementProps) { 

    const [ channels, setChannels ] = useState(retrieveChannels() || []);

    const [ currentChannel, setCurrentChannel ] = useState<Channel | undefined>(undefined);

    const channelDisplays = 
        channels.map(channel => {
            return <AccordionTab header={<header className="flex align-items-center gap-2 justify-content-left">{channel.name} <Button onClick={() => setCurrentChannel(channel)}>Play</Button></header>}>
                <section className="fens grid row-gap-3 align-items-center justify-content-center">{channel.seed_fens.map(fen => 
                    <TinyFENDisplay fen={fen} invert={channel.invert} />
                )}</section>
            </AccordionTab>
        });

    if (currentChannel) {
        return <MultipleFENTV fens={currentChannel.seed_fens} closeHandler={() => {setCurrentChannel(undefined)}} startInverted={currentChannel.invert}/>
    }

    return <>
        <h1>Channels</h1>
        <Accordion>
            {channelDisplays}
        </Accordion>
    </>
}

const channelStorage = "CHANNELS";

function saveAllChannels(channelBlob: Channel[]) {
    localStorage.setItem(channelStorage, JSON.stringify(channelBlob));
}

function retrieveChannels(): Channel[] | undefined {
    const currentValue = localStorage.getItem(channelStorage);

    if (currentValue) {
        return JSON.parse(currentValue);
    }
}