import {setItemGZIP} from "../storage";

export default function reducer(state, action) {
    if (action.type === 'ADD_ANALYSIS') {
        // console.log("Adding analysis")

        const newState = {
            ...action.data,
            ...state
        };

        if (Object.keys(newState).length !== Object.keys(state).length) {
            setItemGZIP('analysisDatabase', newState);
        }

        return newState;

    } else if (action.type === 'RESET') {
        setItemGZIP('analysisDatabase', {});
        return {};
    }
    throw Error('Unknown action.');
}