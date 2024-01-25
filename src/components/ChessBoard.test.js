import { render, screen, act, fireEvent } from '@testing-library/react';
import ChessBoard from './ChessBoard';

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

    jest.useFakeTimers();

    global.Chessboard = (_, config) => {
        lastConfig = config;

        return {
            flip: jest.fn(),
            move: jest.fn(),
            position: jest.fn()
        }
    }
});

// Running all pending timers and switching to real timers using Jest
afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
})

test('Basic Component Load', async () => {
    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                invert: false,
                fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R',
                arrows: [],
                draggable: false,
                dropOffBoard: 'snapback',
                madeMoveRef: {current: true},
                moveCallback: (move => {
                    console.log("Got move", move)
                }),
                moves: []
            }} />
        );
    });
    await act(() => {

        jest.runOnlyPendingTimers()

    });

});


test('Default Parameter Values', async () => {
    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
            }} />
        );
    });
    await act(() => {

        jest.runOnlyPendingTimers()

    });


});

const delay = ms => new Promise(res => setTimeout(res, ms));
test('Put some moves in', async () => {
    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                moves: [ "e4", "e5"]
            }} />
        );
    });
    await act(() => {

        jest.runOnlyPendingTimers()

    });

});


test('Inverted', async () => {
    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                moves: [ "e4", "e5"],
                invert: true
            }} />
        );
    });
    await act(() => {


        jest.runOnlyPendingTimers()
        jest.runOnlyPendingTimers()
        jest.runOnlyPendingTimers()
    });

});


test('Chessboard call failure case', async () => {

    global.Chessboard = jest.fn();
    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                moves: [ "e4", "e5"],
                invert: true
            }} />
        );
    });
    await act(() => {

        jest.runOnlyPendingTimers()
        jest.runOnlyPendingTimers()
        jest.runOnlyPendingTimers()
    });


});



test('Exception during move does not crash the application', async () => {

    global.Chessboard = (_, config) => {
        lastConfig = config;

        return {
            flip: jest.fn(),
            move: () => {
                throw new Error("Example Error")
            }
        }
    }
    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                moves: [ "e5"],
            }} />
        );
    });
    await act(() => {


        // Each move requires one call to this function in addition to one required to start the moves at all
        jest.runOnlyPendingTimers()
        jest.runOnlyPendingTimers()
    });



});

test('Exception during move does not crash the application', async () => {

    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                draggable: true
            }} />
        );
    });
    await act(() => {

        jest.runOnlyPendingTimers()
    });

});



test('Test Callbacks', async () => {

    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                draggable: true,
                moves: []
            }} />
        );

    });
    await act(() => {

        jest.runOnlyPendingTimers()

        lastConfig.onDragStart();
        lastConfig.onDrop();
        lastConfig.onSnapEnd();
    });
});

test('No move if the game is finished', async () => {

    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                draggable: true,
                madeMoveRef: { current : false },
                moves: ["e4", "e5", "Bc4", "a6", "Qh5", "a5", "Qxf7#"]
            }} />

        );
    });
    await act(() => {


        // Play all the moves
        for (let index = 0; index < 9; index++) {
            jest.runOnlyPendingTimers()
        }

        lastConfig.onDragStart("", "b", "", "");
        lastConfig.onDragStart("", "w", "", "");
    });
});


test("Test onDragStart as white's move", async () => {

    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                draggable: true,
                madeMoveRef: { current : false },
                moves: ["e4", "e5", "Bc4", "a6", "Qh5", "a5"]
            }} />
        );
    });
    await act(() => {


        // Play all the moves
        for (let index = 0; index < 9; index++) {
            jest.runOnlyPendingTimers()
        }

        lastConfig.onDragStart("", "b", "", "");
        lastConfig.onDragStart("", "w", "", "");
    });
});


test('Play a move', async () => {

    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                draggable: true,
                madeMoveRef: {current: false},
                moves: ["e4", "e5", "Bc4", "a6", "Qh5", "a5"]
            }} />
        );
    });
    await act(() => {

        // Play all the moves
        for (let index = 0; index < 9; index++) {
            jest.runOnlyPendingTimers()
        }

        lastConfig.onDrop("h5", "f7");
    });
});

test('Play an invalid move', async () => {

    await act(() => {
        render(
            <ChessBoard {...{
                name,
                game_url: "test",
                draggable: true,
                madeMoveRef: { current : false },
                moves: ["e4", "e5", "Bc4", "a6", "Qh5", "a5"]
            }} />
        );
    });
    await act(() => {


        // Play all the moves
        for (let index = 0; index < 9; index++) {
            jest.runOnlyPendingTimers()
        }

        lastConfig.onDrop("h5", "f8");
    });
});