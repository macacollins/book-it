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

const chessBoardCSSURL = new URL('./chessboard-1.0.0.min.css', import.meta.url).href
const chessboardJSURL = new URL('./chessboard-1.0.0.min.js', import.meta.url).href
const jqueryURL = new URL('./jquery-3.5.1.min.js', import.meta.url).href


loadCachedData().then((propsFromLocalStorage) => {
  let worker = new MyWorker();
  Test();

  document.getElementById('jquery-script').src = jqueryURL
  setTimeout(() => {
    document.getElementById('chessboard-js-script').src = chessboardJSURL
    document.getElementById('chessboard-css-link').src = chessBoardCSSURL
  }, 10);

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <App worker={worker} {...propsFromLocalStorage} />
    </React.StrictMode>,
  );  

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
})

