
import {getRepertoireMove} from "../analysis/getRepertoireMove";

test('Invalid input returns oops', () => {

    let response = getRepertoireMove(3)("atb34b34")

    expect(response).toEqual("oops");
});

test('Index too high returns oops', () => {

    let response = getRepertoireMove(3)("1.d4")

    expect(response).toEqual("oops");
});