import React, { Component } from "react";
import ROT from '../../rot';
import Game from '../../game';
import * as util from '../../util'
import { dirname } from "path";
import './app.css';
import 'codemirror/theme/vibrant-ink.css';
import 'codemirror/lib/codemirror.css';

class App extends Component {

    constructor() {
        super();
        this.state = {
            inventory: [],
            game: null
        }
    }

    componentDidMount() {
        window.ROT = ROT;
        let startLevel = util.getParameterByName('lvl') ? parseInt(getParameterByName('lvl')) : null;
        let game = new Game(startLevel, "screen", this);
        this.setState({ game }, () => {
            //console.log(game);
            this.state.game.initialize();

            // contentEditable is required for canvas elements to detect keyboard events
            this.state.game.display.getContainer().setAttribute("contentEditable", "true");

            document.getElementById("screen").appendChild(this.state.game.display.getContainer());
        });

    }

    drawInventory(item) {
        let inv = this.state.inventory.slice(0);
        inv.push(item);
        this.setState({ inventory: inv });
    }

    onExecute() {
        this.state.game.evalLevelCode();
    }

    render() {
        return (
            <div id="container">
                <div id="panes">
                    <div id="screenPane">
                        <canvas id="drawingCanvas"></canvas>
                        <div id="dummyDom"></div>
                        <div id="screen"></div>
                        <div id="inventory">
                            {this.state.inventory}
                        </div>
                        <div id="output"></div>
                        <div id="chapter"></div>
                    </div>

                    <div id="editorPane">
                        <textarea id="editor"></textarea>
                        <div id="buttons">
                            <span onClick={() => this.onExecute()}>
                                <a id="executeButton" title="Ctrl+5: Execute">
                                    <span className="keys">^5</span> Execute
                                </a>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;