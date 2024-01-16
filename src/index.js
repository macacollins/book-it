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
    <App worker={worker} { ... propsFromLocalStorage }/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();