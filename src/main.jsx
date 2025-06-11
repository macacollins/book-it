import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import loadCachedData from "./loadCachedData";
import "primereact/resources/themes/lara-dark-green/theme.css";
import "primeflex/primeflex.css";

import "./index.css";

import MyWorker from './worker?worker'
import Test from './service-worker?worker'; // try to get it installed

loadCachedData().then((propsFromLocalStorage) => {
  let worker = new MyWorker();
  Test();

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <App worker={worker} {...propsFromLocalStorage} />
    </React.StrictMode>,
  );  
})

if ('serviceWorker' in navigator) {
  console.log("Attempting to install service worker");

  let registration;

  const registerServiceWorker = async () => {
    try {
      registration = await navigator.serviceWorker.register('./service-worker.js');
      console.log("Registration finished with result of ", registration);

    } catch (e) {
      console.log("Failed during registration.", e);
    }
  };

  registerServiceWorker();
} else {
  console.log("Service worker did not initialize because it was not in navigator");
}