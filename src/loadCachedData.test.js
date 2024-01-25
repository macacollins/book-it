import { render, screen, act } from '@testing-library/react';
import ReactDOM from 'react-dom/client';
import loadCachedData from './loadCachedData';

jest.mock("./storage")

import {keysCalledGet, resetKeys} from './storage';

// Canary Test
test('loadCachedData makes the appropriate number of dexie calls', async () => {

    resetKeys();
    await loadCachedData();

    expect(keysCalledGet.length).toBe(9);
});

