import { fireEvent, render, screen, act } from '@testing-library/react';
import Results from './Results';

jest.mock("../storage")

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

    global.Chessboard = jest.fn();
    global.fetch = jest.fn(() => Promise.resolve());
});

test('Renders Results page and leftBookCheckbox', async () => {
    let setUserLeftBookOnly = jest.fn();
    await act(() => {
        let props = {
            games: undefined,
            userLeftBookOnly: true,
            setUserLeftBookOnly: setUserLeftBookOnly,
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {
            }
        }
        render(<Results {...props} />);
    });
});
test('Renders Results page and leftBookCheckbox', async () => {
    let setUserLeftBookOnly = jest.fn();
    await act(() => {
        let props = {
            games: defaultGames,
            userLeftBookOnly: true,
            setUserLeftBookOnly: setUserLeftBookOnly,
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {
            }
        }
        render(<Results {...props} />);
    });

    const linkElement = screen.getByTestId("leftBookCheckbox");
    expect(linkElement).toBeInTheDocument();

    let fourResults = screen.getByText(/Found 4 results/i);
    expect(fourResults).toBeInTheDocument();

    await act(() => {
        fireEvent.click(linkElement);
    });

    expect(setUserLeftBookOnly).toHaveBeenCalled();
});

test('Clicks leftBookCheckbox off too', async () => {
    let setUserLeftBookOnly = jest.fn();
    await act(() => {
        let props = {
            games: defaultGames,
            userLeftBookOnly: false,
            setUserLeftBookOnly: setUserLeftBookOnly,
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {
            }
        }
        render(<Results {...props} />);
    });

    const linkElement = screen.getByTestId("leftBookCheckbox");
    expect(linkElement).toBeInTheDocument();

    let fourResults = screen.getByText(/Found 5 results/i);
    expect(fourResults).toBeInTheDocument();

    await act(() => {
        fireEvent.click(linkElement);
    });

    expect(setUserLeftBookOnly).toHaveBeenCalled();
});
test('The filter filters out all the other openings from the results list', async () => {

    await act(() => {
        let props = {
            games : defaultGames,
            userLeftBookOnly: false,
            setUserLeftBookOnly: () => {},
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {}
        }
        render(<Results {...props} />);
    });

    const filter = screen.getByTestId("opening-Queen's Gambit Declined");
    expect(filter).toBeInTheDocument();

    await act(() => {
        fireEvent.click(filter)
    });

    // Three of them were QGD, 2 QGA
    const threeResults = screen.getByText(/Found 3 results/i);
    expect(threeResults).toBeInTheDocument();

    const filter2 = screen.getByTestId("opening-Queen's Gambit Accepted");
    expect(filter2).toBeInTheDocument();

    await act(() => {
        fireEvent.click(filter2)
    });

    // Three of them were QGD, 2 QGA
    const twoResults = screen.getByText(/Found 2 results/i);
    expect(twoResults).toBeInTheDocument();
});

test('Clear Opening Filter Works', async () => {

    await act(() => {
        let props = {
            games : defaultGames,
            userLeftBookOnly: true,
            setUserLeftBookOnly: () => {},
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {}
        }
        render(<Results {...props} />);
    });

    const filter = screen.getByTestId("opening-Queen's Gambit Declined");
    expect(filter).toBeInTheDocument();

    await act(() => {
        fireEvent.click(filter)
    });

    // Three of them were QGD, 2 QGA
    const threeResults = screen.getByText(/Found 2 results/i);
    expect(threeResults).toBeInTheDocument();

    const filter2 = screen.getByTestId("clear-opening-filter");
    expect(filter2).toBeInTheDocument();

    await act(() => {
        fireEvent.click(filter2)
    });

    // Three of them were QGD, 2 QGA
    const twoResults = screen.getByText(/Found 4 results/i);
    expect(twoResults).toBeInTheDocument();

});


test('Some of games creates pagination', async () => {

    let lotsOfGames = [];
    for (let index = 0; index < 50; index++) {
        lotsOfGames = [...lotsOfGames, ...defaultGames]
    }

    await act(() => {
        let props = {
            games : lotsOfGames,
            userLeftBookOnly: false,
            setUserLeftBookOnly: () => {},
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {}
        }
        render(<Results {...props} />);
    });

    const filter = screen.getAllByTestId("page-1-button")[0];
    expect(filter).toBeInTheDocument();
});

test('Lots of games creates pagination with only the last button', async () => {

    let lotsOfGames = [];
    for (let index = 0; index < 50; index++) {
        lotsOfGames = [...lotsOfGames, ...defaultGames]
    }

    await act(() => {
        let props = {
            games : lotsOfGames,
            userLeftBookOnly: false,
            setUserLeftBookOnly: () => {},
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {}
        }
        render(<Results {...props} />);
    });

    const filter = screen.getAllByTestId("last-page-button")[0];
    expect(filter).toBeInTheDocument();
});

test("The first button doesn't appear until you click a page greater than 5", async () => {

    let lotsOfGames = [];
    for (let index = 0; index < 50; index++) {
        lotsOfGames = [...lotsOfGames, ...defaultGames]
    }

    await act(() => {
        let props = {
            games : lotsOfGames,
            userLeftBookOnly: false,
            setUserLeftBookOnly: () => {},
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {}
        }
        render(<Results {...props} />);

    });

    const page8Button = screen.getAllByTestId("page-8-button")[0];
    expect(page8Button).toBeInTheDocument();

    await act(() => {
        fireEvent.click(page8Button);
    });

    const filter = screen.getAllByTestId("last-page-button")[0];
    expect(filter).toBeInTheDocument();

    const firstPageButton = screen.getAllByTestId("first-page-button")[0];
    expect(firstPageButton).toBeInTheDocument();
});


test("The first button sets the page back to 1", async () => {

    let lotsOfGames = [];
    for (let index = 0; index < 50; index++) {
        lotsOfGames = [...lotsOfGames, ...defaultGames]
    }

    await act(() => {
        let props = {
            games : lotsOfGames,
            userLeftBookOnly: false,
            setUserLeftBookOnly: () => {},
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {}
        }
        render(<Results {...props} />);

    });

    const page8Button = screen.getAllByTestId("page-8-button")[0];
    expect(page8Button).toBeInTheDocument();

    await act(() => {
        fireEvent.click(page8Button);
    });

    const filter = screen.getAllByTestId("last-page-button")[0];
    expect(filter).toBeInTheDocument();

    const firstPageButton = screen.getAllByTestId("first-page-button")[0];
    expect(firstPageButton).toBeInTheDocument();

    await act(() => {
        fireEvent.click(firstPageButton);
    });

    expect(firstPageButton).not.toBeInTheDocument();
});


test("The last button sets the page to the maximum", async () => {

    let lotsOfGames = [];
    for (let index = 0; index < 50; index++) {
        lotsOfGames = [...lotsOfGames, ...defaultGames]
    }

    await act(() => {
        let props = {
            games : lotsOfGames,
            userLeftBookOnly: false,
            setUserLeftBookOnly: () => {},
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {}
        }
        render(<Results {...props} />);

    });

    const page8Button = screen.getAllByTestId("page-8-button")[0];
    expect(page8Button).toBeInTheDocument();

    await act(() => {
        fireEvent.click(page8Button);
    });

    const filter = screen.getAllByTestId("last-page-button")[0];
    expect(filter).toBeInTheDocument();

    const firstPageButton = screen.getAllByTestId("first-page-button")[0];
    expect(firstPageButton).toBeInTheDocument();

    await act(() => {
        fireEvent.click(filter);
    });

    expect(filter).not.toBeInTheDocument();
});



test("Refresh Games button calls refreshGames", async () => {

    let lotsOfGames = [];
    for (let index = 0; index < 50; index++) {
        lotsOfGames = [...lotsOfGames, ...defaultGames]
    }

    await act(() => {
        let props = {
            games : lotsOfGames,
            userLeftBookOnly: false,
            setUserLeftBookOnly: () => {},
            playerName: "example",
            repertoireChoice: "Queen's Gambit",
            analysisDatabase,
            setGames: () => {}
        }
        render(<Results {...props} />);

    });

    const refreshGamesButton = screen.getAllByTestId("refreshGamesButton")[0];
    expect(refreshGamesButton).toBeInTheDocument();

    await act(() => {
        fireEvent.click(refreshGamesButton);
    });

});