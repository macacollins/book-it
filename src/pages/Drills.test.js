import { render, screen, act } from '@testing-library/react';
import ReactDOM from 'react-dom/client';
import Drills from './Drills';

// jest.mock("../storage")

import defaultGames from '../integrations/default-games'
import defaultLines from '../integrations/default-lines'

import {calculateRepertoire} from "../integrations/calculateRepertoire";
import calculateAnalysis from "../analysis/calculateAnalysis";

let analysisDatabase = {};

beforeAll(() => {

    let playerName = "example";

    let repertoire = calculateRepertoire(defaultLines);

    for (let game of defaultGames) {
        let analysis = calculateAnalysis(analysisDatabase, repertoire, game, playerName);
        analysisDatabase[game.url] = analysis;
    }
});

// Canary Test
test('Renders Lichess Analysis button', async () => {
    await act(() => {
        console.log(render(<Drills games={defaultGames} analysisDatabase={analysisDatabase} />));
    });

    const linkElement = screen.getByText(/Lichess Analysis/i);
    expect(linkElement).toBeInTheDocument();

});

