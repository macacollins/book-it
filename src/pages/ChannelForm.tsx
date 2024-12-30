import { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import { Chess } from "chess.js";
import pgnParser, { ParsedPGN } from "pgn-parser";
import { Channel } from "../types/Channel";
import { TVFENPicker } from "./TVFENPicker";
import { TinyFENDisplay } from "./TinyFENDisplay";

import 'primeflex/primeflex.css';
import Repertoire from '../types/Repertoire';
const channelStorage = "CHANNELS";

export function ChannelForm({ repertoire }: { repertoire: Repertoire}) {

    const [newName, setNewName] = useState("");
    const [invertBoard, setInvertBoard] = useState(false);
    const [fen, setFEN] = useState<string[]>([]);
    const [previewFENs, setPreviewFENs] = useState<string[]>([]);
    const [repertoireDepth, setRepertoireDepth] = useState(2);

    const previewFENSection = previewFENs.map(fen => <TinyFENDisplay fen={fen} invert={invertBoard} />);

    const stepperRef = useRef<any>(null);

    const createChannelButton = <Button className="max-h-3rem my-3" disabled={previewFENs.length === 0} label="Create Channel" onClick={() => {

        // Here we need to do the procedure
        const newChannel: Channel = {
            name: newName,
            seed_fens: previewFENs,
            invert: invertBoard
        };

        const currentChannels = retrieveChannels() || [];
        const newChannels = [...currentChannels, newChannel];
        saveAllChannels(newChannels);

        setNewName("");
        setInvertBoard(false);
        setFEN([]);
        setPreviewFENs([]);
        setRepertoireDepth(2);
    }} />;

    function generatePreviewFENs() {
        let finalLines: string[] = [];

        for (const singleFEN of fen) {
            let lines = repertoire[singleFEN].map((line: string) => {

                const lineChess = new Chess();

                let pgn: ParsedPGN = pgnParser.parse(line + " *")[0];

                let countdown = pgn.moves.length;
                let currentIndex = 0;

                let finalFEN = singleFEN;
                pgn.moves.forEach(move => {
                    currentIndex = currentIndex + 1;
                    countdown = countdown - 1;

                    lineChess.move(move.move);

                    if (lineChess.fen() === singleFEN) {
                        countdown = repertoireDepth;
                    }

                    if (countdown === 0) {
                        finalFEN = lineChess.fen();
                    }
                });

                return finalFEN;
            });

            finalLines = [...finalLines, ...lines];
        }

        setPreviewFENs([...new Set(finalLines)]);
    }

    const steps = <Stepper ref={stepperRef}>
        <StepperPanel header="Color">
            <div className="flex flex-column h-12rem">
                <div className="flex-auto flex justify-content-center align-items-center font-medium gap-3">
                    <Button onClick={() => { stepperRef.current?.nextCallback(); }} label="White" />
                    <Button onClick={() => { setInvertBoard(true); stepperRef.current?.nextCallback(); }} label="Black" />

                </div>
            </div>
        </StepperPanel>
        <StepperPanel header="Start Position">
            <div className="flex flex-column h-12rem">
                <TVFENPicker invert={invertBoard} setFEN={(newFEN: string) => {
                    setFEN([...fen, newFEN]);
                }} />
            </div>
            <div className="flex pt-4 justify-content-between">
                <Button label="Back" severity="secondary" icon="pi pi-arrow-left" onClick={() => stepperRef.current?.prevCallback()} />
                <Button label="Next" icon="pi pi-arrow-right" iconPos="right" onClick={() => {
                    generatePreviewFENs();
                    stepperRef.current?.nextCallback();
                }} />
            </div>
        </StepperPanel>
        <StepperPanel header="Review">
            <section className="form flex gap-3">
                <label className={"p-3 gap-1 flex flex-column font-bold"}>
                    Match Depth
                    <InputNumber value={repertoireDepth} onValueChange={(e: any) => setRepertoireDepth(e.value)} placeholder="Repertoire Depth" />
                </label>
                <label className={"p-3 gap-1 flex flex-column font-bold"}>
                    Name
                    <InputText value={newName} onInput={(e: any) => { console.log(e); setNewName(e.target.value); }} placeholder="Name"></InputText>
                </label>
                <label className={"p-3 gap-1 flex flex-column font-bold"}>
                    Invert
                    <Checkbox checked={invertBoard} onClick={(e: any) => { console.log(e); setInvertBoard(!invertBoard); }} />
                </label>

                {createChannelButton}
            </section>
            <div className="flex gap-2 flex-wrap">{previewFENSection}</div>

            <div className="flex pt-4 justify-content-start">
                <Button label="Back" severity="secondary" icon="pi pi-arrow-left" onClick={() => stepperRef.current?.prevCallback()} />
            </div>
        </StepperPanel>
    </Stepper>;

    return <div className="m-3">
        <h2>New Channel</h2>
        {steps}
    </div>;
}

function saveAllChannels(channelBlob: Channel[]) {
    localStorage.setItem(channelStorage, JSON.stringify(channelBlob));
}

function retrieveChannels(): Channel[] | undefined {
    const currentValue = localStorage.getItem(channelStorage);

    if (currentValue) {
        return JSON.parse(currentValue);
    }
}
