import {act, render, screen, fireEvent} from "@testing-library/react";
import userEvent from '@testing-library/user-event'
jest.mock("../storage")
import App from "../App";

test('renders learn react link', async () => {
    const user = userEvent.setup()
    await act(() => {
        render(<App />);
    });

    let chessDotComUsernameInput = screen.getByTestId("chess-dot-com-username")
    let newRepertoireNameField = screen.getByTestId("new-repertoire-name-field")
    let resetGamesButton = screen.getByTestId("reset-games-button")
    let resetRepertoiresButton = screen.getByTestId("reset-repertoires-button")
    let resetAnalysisDBButton = screen.getByTestId("reset-analysis-db-button")
    let repertoireChoiceInput = screen.getByTestId("repertoireChoiceFieldQueen's Gambit")

    expect(chessDotComUsernameInput).toBeInTheDocument();
    expect(newRepertoireNameField).toBeInTheDocument();
    expect(resetGamesButton).toBeInTheDocument();
    expect(resetRepertoiresButton).toBeInTheDocument();
    expect(resetAnalysisDBButton).toBeInTheDocument();

    // console.log(screen.getByLabelText("Repertoire Name"));

    // await act(async () => {
    await user.click(chessDotComUsernameInput)
    // });
    await act(() => {
        fireEvent.click(resetGamesButton);
        fireEvent.click(resetRepertoiresButton);
        fireEvent.click(resetAnalysisDBButton);
        fireEvent.click(repertoireChoiceInput);
        fireEvent(chessDotComUsernameInput, new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                target: {
                    value: "Test Input"
                }
            })
        )
        fireEvent(newRepertoireNameField, new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                target: {
                    value: "Test Input"
                }
            })
        )
        // await user.type(chessDotComUsernameInput, "Test Value", { delay: 1000 })
    });

});

