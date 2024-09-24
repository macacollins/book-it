import { render, screen, act, fireEvent } from '@testing-library/react';
import ReactDOM from 'react-dom/client';
import Drills from './Drills';

// jest.mock("../storage")

import defaultGames from '../integrations/default-games'
import defaultLines from '../integrations/default-lines'
import {getLastProps} from '../components/ChessBoard';

import {calculateRepertoire} from "../integrations/calculateRepertoire";
import calculateAnalysis from "../analysis/calculateAnalysis";

let analysisDatabase = {};
jest.mock("../components/ChessBoard")

const clickTime = async (button = /Time/i) => {

    let timeButton = screen.getByText(button);
    expect(timeButton).toBeInTheDocument();

    await act(() => {
        fireEvent.click(timeButton);
    });
}

beforeAll(() => {

    let playerName = "example";

    let repertoire = calculateRepertoire(defaultLines.split("\n"));

    for (let game of defaultGames) {
        let analysis = calculateAnalysis(analysisDatabase, repertoire, game, playerName);
        analysisDatabase[game.url] = analysis;
    }

    global.open = jest.fn();
});

test('Render with no data', async () => {
    await act(() => {
        render(<Drills games={undefined} analysisDatabase={analysisDatabase} />);
    });
});


test('Page Loads', async () => {
    await act(() => {
        render(<Drills games={defaultGames} analysisDatabase={analysisDatabase} />);
    });

    await clickTime();

    const linkElement = screen.getByText(/Lichess/i);
    expect(linkElement).toBeInTheDocument();
});


test('Page Loads frequency button', async () => {
    await act(() => {
        render(<Drills games={defaultGames} analysisDatabase={analysisDatabase} />);
    });

    await clickTime(/Frequency/i);

    const linkElement = screen.getByText(/Lichess/i);
    expect(linkElement).toBeInTheDocument();
});


test('Page Loads from position', async () => {
    await act(() => {
        render(<Drills games={defaultGames} analysisDatabase={analysisDatabase} repertoire={{'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : []}}/>);
    });

    await clickTime(/From Position/i);
});


test('Inputs Work: correct move', async () => {
    await act(() => {
        render(<Drills games={defaultGames} analysisDatabase={analysisDatabase} />);
    });

    await clickTime();

    const linkElement = screen.getByText(/Lichess/i);
    expect(linkElement).toBeInTheDocument();

    await act(() => {
        getLastProps().moveCallback({san:"Bd3"});
    });

    const congratsMessage = screen.getByText(/Congrats/i);
    expect(congratsMessage).toBeInTheDocument();
});

test('Inputs Work: wrong move', async () => {
    await act(() => {
        render(<Drills games={defaultGames} analysisDatabase={analysisDatabase} />);
    });

    await clickTime();

    const linkElement = screen.getByText(/Lichess/i);
    expect(linkElement).toBeInTheDocument();

    await act(() => {
        getLastProps().moveCallback({san:"Be7"});
    });

    const oopsMessage = screen.getByText(/Oops, better study on this one./i);
    expect(oopsMessage).toBeInTheDocument();
});


test('Next Works: correct move', async () => {
    await act(() => {
        render(<Drills games={defaultGames} analysisDatabase={analysisDatabase} />);
    });

    await clickTime();

    const linkElement = screen.getByText(/Lichess/i);
    expect(linkElement).toBeInTheDocument();

    await act(() => {
        getLastProps().moveCallback({san:"Bd3"});
    });

    const nextButton = screen.getByTestId("next-button");
    const congratsMessage = screen.getByText(/Congrats/i);

    await act(() => {
        fireEvent.click(nextButton)
    });

    expect(congratsMessage).not.toBeInTheDocument();
    expect(nextButton).not.toBeInTheDocument();

});

test('Next Works: wrong move', async () => {
    await act(() => {
        render(<Drills games={defaultGames} analysisDatabase={analysisDatabase} />);
    });

    await clickTime();

    const linkElement = screen.getByText(/Lichess/i);
    expect(linkElement).toBeInTheDocument();

    await act(() => {
        getLastProps().moveCallback({san:"Be7"});
    });

    const oopsMessage = screen.getByText(/Oops, better study on this one./i);
    const nextButton = screen.getByTestId("next-button");

    await act(() => {
        fireEvent.click(nextButton)
    });
    expect(oopsMessage).not.toBeInTheDocument();
    expect(nextButton).not.toBeInTheDocument();
});


test('Links work', async () => {
    await act(() => {
        render(<Drills games={defaultGames} analysisDatabase={analysisDatabase} />);
    });

    await clickTime();

    const linkElement = screen.getByText(/Lichess/i);
    expect(linkElement).toBeInTheDocument();

    await act(() => {
        getLastProps().moveCallback({san:"Be7"});
    });

    const chessDotComButton = screen.getByTestId("chess-dot-com-button");
    const lichessButton = screen.getByTestId("lichess-button");
    const chessableButton = screen.getByTestId("chessable-button");

    await act(() => {
        fireEvent.click(chessDotComButton);
        fireEvent.click(lichessButton);
        fireEvent.click(chessableButton);
    });

    expect(window.open).toHaveBeenCalledTimes(3);
});
