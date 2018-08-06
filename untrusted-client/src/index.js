import React from "react";
import ReactDOM from "react-dom";
import App from "./components/AppComponent/app";
import './index.css';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById("root"));

registerServiceWorker();  // Runs register() as default function

//TODO
