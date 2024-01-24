import {calculateFinalPosition} from './calculateFinalPosition';

import defaultGames from '../integrations/default-games'

test('Result length is correct', () => {

    let finalPosition = calculateFinalPosition("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", false, defaultGames[0])

    expect(finalPosition.fen()).toEqual("rnbqk2r/1p1pppb1/p4npp/2p5/2PP3B/4PN2/PP3PPP/RN1QKB1R w KQkq - 0 7");
});
