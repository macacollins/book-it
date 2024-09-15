jest.mock('../storage');

import refreshGames from './chess.com';

import defaultGames from './default-games';


// src/utils/currency.test.js
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({games: defaultGames}),
  })
);

test('Parses chess.com mock data', async () => {
    const setGames = jest.fn();
    const playerName = "test";
    const setSyncingGames = jest.fn();
    const games = [];

    await refreshGames(setGames, playerName, setSyncingGames);
});
