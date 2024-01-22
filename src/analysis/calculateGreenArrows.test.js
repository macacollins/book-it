
import {calculateGreenArrows} from "../analysis/calculateGreenArrows";

test('Result length is correct', () => {

    let greenArrows = calculateGreenArrows(["a4", "b4", "c4"], "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", false)

    expect(greenArrows.length).toEqual(3);
});


test('Error handling is ok (drop invalid moves)', () => {

    console.log("About to attempt illegal move a6 from start position. Expecting it to log an exception")
    let greenArrows = calculateGreenArrows(["a6", "b4", "c4"], "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", false)

    expect(greenArrows.length).toEqual(2);
});

test('from and dest values are set correctly', () => {

    let greenArrows = calculateGreenArrows(["a4", "b4", "c4"], "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", false)

    expect(greenArrows[0].fromX).toEqual(1);
    expect(greenArrows[0].fromY).toEqual(2);
    expect(greenArrows[0].destX).toEqual(1);
    expect(greenArrows[0].destY).toEqual(4);

    expect(greenArrows[1].fromX).toEqual(2);
    expect(greenArrows[1].fromY).toEqual(2);
    expect(greenArrows[1].destX).toEqual(2);
    expect(greenArrows[1].destY).toEqual(4);

    expect(greenArrows[2].fromX).toEqual(3);
    expect(greenArrows[2].fromY).toEqual(2);
    expect(greenArrows[2].destX).toEqual(3);
    expect(greenArrows[2].destY).toEqual(4);
});


test('inverted from and dest values are set correctly', () => {

    let greenArrows = calculateGreenArrows(["a4", "b4", "c4"], "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", true)

    expect(greenArrows[0].fromX).toEqual(8);
    expect(greenArrows[0].fromY).toEqual(7);
    expect(greenArrows[0].destX).toEqual(8);
    expect(greenArrows[0].destY).toEqual(5);

    expect(greenArrows[1].fromX).toEqual(7);
    expect(greenArrows[1].fromY).toEqual(7);
    expect(greenArrows[1].destX).toEqual(7);
    expect(greenArrows[1].destY).toEqual(5);

    expect(greenArrows[2].fromX).toEqual(6);
    expect(greenArrows[2].fromY).toEqual(7);
    expect(greenArrows[2].destX).toEqual(6);
    expect(greenArrows[2].destY).toEqual(5);
});
