import {setItemDexie} from "../storage";

export default function reducer(state = {}, action) {
    if (action.type === 'ADD_ANALYSIS') {
        // console.log("Adding analysis")

        const newState = {
            ...action.data,
            ...state
        };

        if (Object.keys(newState).length !== Object.keys(state).length) {
            setItemDexie('analysisDatabase', newState);
        }

        return newState;

    } else if (action.type === 'RESET') {
        setItemDexie('analysisDatabase', {});
        return {};
    }
    throw Error('Unknown action.');
}