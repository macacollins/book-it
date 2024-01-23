
import {calculateAdvice, YOU_LEFT_BOOK, THEY_LEFT_BOOK, POSITION_NOT_FOUND} from "./calculateAdvice";

test('With no intersection, get the position not found', () => {

    const testAnalysis =
        { foundIntersection: false, youLeftBook: false };

    let advice = calculateAdvice(testAnalysis)

    expect(advice).toEqual(POSITION_NOT_FOUND);
});

test('If they left, get THEY_LEFT_BOOK', () => {

    const testAnalysis =
        { foundIntersection: true, youLeftBook: false };

    let advice = calculateAdvice(testAnalysis)

    expect(advice).toEqual(THEY_LEFT_BOOK);
});

test('If you left, get YOU_LEFT_BOOK', () => {

    const testAnalysis =
        { foundIntersection: true, youLeftBook: true };

    let advice = calculateAdvice(testAnalysis)

    expect(advice).toEqual(YOU_LEFT_BOOK);
});
