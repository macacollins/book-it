import { render, screen, act, fireEvent } from '@testing-library/react';
import FileUpload from './FileUpload';

jest.mock("../storage")

import defaultGames from '../integrations/default-games'
import defaultLines from '../integrations/default-lines'
import userEvent from '@testing-library/user-event'

import {calculateRepertoire} from "../integrations/calculateRepertoire";
import calculateAnalysis from "../analysis/calculateAnalysis";

let analysisDatabase = {};

let repertoire;

const file = new File(defaultLines.split("\n"), "defaultLines.pgn", { type: "text/pgn" });

beforeAll(() => {

    let playerName = "example";

    repertoire = calculateRepertoire(defaultLines);

    for (let game of defaultGames) {
        let analysis = calculateAnalysis(analysisDatabase, repertoire, game, playerName);
        analysisDatabase[game.url] = analysis;
    }

    // Mock FileReader because it doesn't fire the onload event properly in RTL
    const fileReader = {
        readAsDataURL: jest.fn(),
        onLoad: jest.fn(),
        readAsText: function(file) {
            this.onload({target: { result : defaultLines }})
        }
    }

    Object.defineProperty(global, 'FileReader', {
        writable: true,
        value: jest.fn().mockImplementation(() => fileReader),
    })
});

test('Basic File Upload', async () => {
    await act(() => {
        render(
            <FileUpload {...{
                    repertoire,
                    setRepertoire : jest.fn(),
                    newRepertoireNameField : "New Repertoire",
                    setNewRepertoireNameField : jest.fn(),
                    repertoireList : [ "Queen's Gambit" ],
                    setRepertoireList : jest.fn()
                }} />
        );
    });

    const uploader = screen.getByTestId("repertoire-upload");

    await act(() => {
        // userEvent.upload(uploader, file)
        fireEvent.change(uploader, {
            target: { files: [file] },
        })
    })
});
