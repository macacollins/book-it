import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import loadCachedData from "./loadCachedData";

import "./index.css";

import MyWorker from './worker?worker'

const propsFromLocalStorage = await loadCachedData();

let worker = new MyWorker();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App worker={worker} {...propsFromLocalStorage} />
  </React.StrictMode>,
);
