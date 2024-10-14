jest.mock("../storage");

import {
  clearLatestLichessTimestamp,
  setLatestLichessTimestamp,
} from "../__mocks__/storage";
import refreshGames from "./lichess.org";

const mockData = `
    [Event "Rated rapid game"]
    [Site "https://lichess.org/Uy76fm"]
    [Date "2024.04.22"]
    [White "test"]
    [Black "test2"]
    [Result "0-1"]
    [UTCDate "2024.04.22"]
    [UTCTime "12:50:06"]
    [WhiteElo "1256"]
    [BlackElo "1541"]
    [WhiteRatingDiff "-6"]
    [BlackRatingDiff "+29"]
    [Variant "Standard"]
    [TimeControl "900+10"]
    [ECO "B10"]
    [Termination "Normal"]

    1. e4 c6 2. Bc4 d5 3. exd5 cxd5 4. Bb3 Nc6 5. Nc3 Nf6 6. d4 Bg4 7. Qd3 e6 8. h3 Bf5 9. Qd1 Bd6 10. Nf3 O-O 11. Qe2 a6 12. Nh4 Nxd4 13. Qe3 Bc5 14. O-O Rc8 15. Nxf5 Nxf5 16. Qf3 Nd4 17. Qd3 Nxb3 18. axb3 h6 19. Qg3 Ne4 20. Nxe4 dxe4 21. Bxh6 Qf6 22. Bg5 Qg6 23. Qf4 Qf5 24. Qd2 f6 25. Be3 Rfd8 26. Qe2 Bxe3 27. fxe3 Qg5 28. Rf4 f5 29. c3 Rd7 30. Kf2 Rcd8 31. Qc4 Rd2+ 32. Ke1 Qg3+ 33. Kf1 Qxg2+ 34. Ke1 Qg3+ 35. Kf1 Rd1+ 36. Rxd1 Rxd1+ 37. Ke2 Qe1# 0-1


    [Event "Rated rapid game"]
    [Site "https://lichess.org/Uy76fm"]
    [Date "2024.04.22"]
    [White "test"]
    [Black "test2"]
    [Result "0-1"]
    [UTCDate "2024.04.21"]
    [UTCTime "12:50:06"]
    [WhiteElo "1256"]
    [BlackElo "1541"]
    [WhiteRatingDiff "-6"]
    [BlackRatingDiff "+29"]
    [Variant "Standard"]
    [TimeControl "900+10"]
    [ECO "B10"]
    [Termination "Normal"]

    1. e4 c6 2. Bc4 d5 3. exd5 cxd5 4. Bb3 Nc6 5. Nc3 Nf6 6. d4 Bg4 7. Qd3 e6 8. h3 Bf5 9. Qd1 Bd6 10. Nf3 O-O 11. Qe2 a6 12. Nh4 Nxd4 13. Qe3 Bc5 14. O-O Rc8 15. Nxf5 Nxf5 16. Qf3 Nd4 17. Qd3 Nxb3 18. axb3 h6 19. Qg3 Ne4 20. Nxe4 dxe4 21. Bxh6 Qf6 22. Bg5 Qg6 23. Qf4 Qf5 24. Qd2 f6 25. Be3 Rfd8 26. Qe2 Bxe3 27. fxe3 Qg5 28. Rf4 f5 29. c3 Rd7 30. Kf2 Rcd8 31. Qc4 Rd2+ 32. Ke1 Qg3+ 33. Kf1 Qxg2+ 34. Ke1 Qg3+ 35. Kf1 Rd1+ 36. Rxd1 Rxd1+ 37. Ke2 Qe1# 0-1
    `;

// src/utils/currency.test.js
global.fetch = jest.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve(mockData),
  }),
);

beforeEach(() => {});

test("Parses lichess mock data", async () => {
  const setGames = jest.fn();
  const playerName = "test";
  const setSyncingGames = jest.fn();
  const games = [];

  await setLatestLichessTimestamp(100);

  await refreshGames(setGames, playerName, setSyncingGames);
  await clearLatestLichessTimestamp();
});

test("Parses lichess mock data 2", async () => {
  const setGames = jest.fn();
  const playerName = "test";
  const setSyncingGames = jest.fn();
  const games = [];

  await setLatestLichessTimestamp(NaN);

  await refreshGames(setGames, playerName, setSyncingGames);
  await clearLatestLichessTimestamp();
});

test("Parses lichess mock data 3", async () => {
  const setGames = jest.fn();
  const playerName = "test";
  const setSyncingGames = jest.fn();
  const games = [];

  await refreshGames(setGames, playerName, setSyncingGames);
});
