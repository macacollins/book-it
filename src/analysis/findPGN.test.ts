import findPGN from "./findPGN";

test("Basic test", () => {
  let pgnResults = findPGN("1.e4 e5 2. c4 c5");

  expect(pgnResults).toEqual(["1.e4 e5 2. c4 c5"]);
});

test("Test with extra characters", () => {
  let pgnResults = findPGN("One example line is 1.e4 e5 2. c4 c5");

  expect(pgnResults).toEqual(["1.e4 e5 2. c4 c5"]);
});

test("3 test", () => {
  let pgnResults = findPGN(
    "One example line is 1.e4 e5 2. c4 c5 and another is 7.e4 e5 8.Nf6 Nf3. A third option is 1.d4 d5 2. c4 c5 ",
  );

  expect(pgnResults).toEqual([
    "1.e4 e5 2. c4 c5",
    "7.e4 e5 8.Nf6 Nf3",
    "1.d4 d5 2. c4 c5",
  ]);
});

test("Black to move first", () => {
  let pgnResults = findPGN(
    "A line for Black is 16...e4 and another is 7.e4 e5 8.Nf6 Nf3. A third option is 1.d4 d5 2. c4 c5 ",
  );

  expect(pgnResults).toEqual([
    "16...e4",
    "7.e4 e5 8.Nf6 Nf3",
    "1.d4 d5 2. c4 c5",
  ]);
});

test("Longer text", () => {
  let pgnResults = findPGN(
    "alternatives in 5.d4 , 5.g3 or 5.e4 , After 5.e3, Black has two moves. After 5.e3 e6 , we reach a position with an early ...c5, covered elsewhere ",
  );

  expect(pgnResults).toEqual(["5.d4", "5.g3", "5.e4", "5.e3", "5.e3 e6"]);
});

test("Separated first move", () => {
  let pgnResults = findPGN("more!) as 9. Bc4. The");

  expect(pgnResults).toEqual(["9. Bc4"]);
});

test("Combined", () => {
  let pgnResults = findPGN("move 12.Bd4! will");

  expect(pgnResults).toEqual(["12.Bd4"]);
});
