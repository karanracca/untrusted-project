import React, { Component } from "react";
import './helpPane.css';

class HelpPane extends Component {

    constructor() {
        super();
        this.state = {
        }
    }
   
    render() {
        return (
            <div id="helpPane">
				<div id="helpPaneSidebar">
					<div id="helpPaneTitle">API Reference</div>
					<ul></ul>
				</div>
				<div id="helpPaneContent"></div>
				<div id="helpPaneCloseButton">x</div>
			</div>
        );
    }
}

export default HelpPane;