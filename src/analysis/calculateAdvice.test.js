
import {calculateAdvice, YOU_LEFT_BOOK, THEY_LEFT_BOOK, POSITION_NOT_FOUND} from "./calculateAdvice";

test('With no intersection, get the position not found', () => {

    let advice = calculateAdvice(false, true)

    expect(advice).toEqual(POSITION_NOT_FOUND);
});

test('If they left, get THEY_LEFT_BOOK', () => {

    let advice = calculateAdvice(true, false)

    expect(advice).toEqual(THEY_LEFT_BOOK);
});

test('If you left, get YOU_LEFT_BOOK', () => {

    let advice = calculateAdvice(true, true)

    expect(advice).toEqual(YOU_LEFT_BOOK);
});
