import { render, screen } from '@testing-library/react';

import calculateAnalysis from './calculateAnalysis';

import defaultGames from '../integrations/default-games'
import defaultLines from '../integrations/default-lines'
import {calculateRepertoire} from "../integrations/calculateRepertoire";

let game = defaultGames[0];

let playerName = "example";

let repertoire = calculateRepertoire(defaultLines);

let analysisDatabase = {};

let analysis = calculateAnalysis(analysisDatabase, repertoire, game, playerName);
console.log("Result was ", analysis);

test('Result is correct', () => {
    expect(analysis.result).toEqual("1-0");
});
test('Analysis has the correct number of arrows for the test game.', () => {
    expect(analysis.arrows.length).toEqual(2);
});
test('Analysis has the correct value for foundIntersection', () => {
    expect(analysis.foundIntersection).toEqual(true);
});
test('Analysis has the correct value for youLeftBook', () => {
    expect(analysis.youLeftBook).toEqual(false);
});
test('Analysis has the correct value for displayFEN', () => {
    expect(analysis.displayFEN).toEqual('rnbqk2r/pp1pppb1/5npp/2p5/2PP3B/4PN2/PP3PPP/RN1QKB1R b KQkq - 0 6');
});
test('Analysis has the correct value for finalMoveIndex', () => {
    expect(analysis.finalMoveIndex).toEqual(11);
});