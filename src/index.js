import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import loadCachedData from "./loadCachedData";

import './index.css'


const propsFromLocalStorage = await loadCachedData();

let worker = new Worker(new URL('./worker.js', import.meta.url));



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App worker={worker} {...propsFromLocalStorage}/>
    </React.StrictMode>
);
