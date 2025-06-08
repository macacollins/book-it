import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import loadCachedData from "./loadCachedData";
import "primereact/resources/themes/lara-dark-green/theme.css";
import "primeflex/primeflex.css";

import "./index.css";

import MyWorker from './worker?worker'

loadCachedData().then(() => {
  let worker = new MyWorker();

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <App worker={worker} {...propsFromLocalStorage} />
    </React.StrictMode>,
  );  
})

