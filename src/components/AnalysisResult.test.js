import { render, screen, act, fireEvent } from '@testing-library/react';
import AnalysisResult from './AnalysisResult';

jest.mock("../storage")

import defaultGames from '../integrations/default-games'
import defaultLines from '../integrations/default-lines'
import userEvent from '@testing-library/user-event'

import {calculateRepertoire} from "../integrations/calculateRepertoire";
import calculateAnalysis from "../analysis/calculateAnalysis";

let analysisDatabase = {};

let repertoire;
let lastConfig;

const file = new File(defaultLines.split("\n"), "defaultLines.pgn", { type: "text/pgn" });

beforeEach(() => {

    let playerName = "example";

    repertoire = calculateRepertoire(defaultLines);

    for (let game of defaultGames) {
        let analysis = calculateAnalysis(analysisDatabase, repertoire, game, playerName);
        analysisDatabase[game.url] = analysis;
    }
    global.open = jest.fn();

    global.Chessboard = (_, config) => {
        lastConfig = config;

        return {
            flip: jest.fn(),
            move: jest.fn(),
            position: jest.fn()
        }
    }
});


test('Basic Component Load', async () => {
    await act(() => {
        render(
            <AnalysisResult {...{analysisDatabase, game: defaultGames[0], nameOverride:"my-name"}} />
        );
    });
});

test('Click Buttons', async () => {
    await act(() => {
        render(
            <AnalysisResult {...{analysisDatabase, game: defaultGames[0], nameOverride:"my-name"}} />
        );
    });

    const chessDotComButton = screen.getByTestId("chess-dot-com-button");
    const lichessButton = screen.getByTestId("lichess-button");
    const chessableButton = screen.getByTestId("chessable-button");

    await act(() => {
        fireEvent.click(chessDotComButton);
        fireEvent.click(lichessButton);
        fireEvent.click(chessableButton);
    })

    expect(window.open).toHaveBeenCalledTimes(3);
});

test('Empty Analysis', async () => {
    await act(() => {
        render(
            <AnalysisResult {...{analysisDatabase: {}, game: defaultGames[0], nameOverride:"my-name"}} />
        );
    });
});

test('EmptyGame', async () => {
    await act(() => {
        render(
            <AnalysisResult {...{analysisDatabase, game: undefined}} />
        );
    });
});