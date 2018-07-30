import React, { Component } from "react";
import ROT from '../../scripts/rot';
import Game from '../../scripts/game';
import * as util from '../../scripts/util'
import './game.css';
import 'codemirror/theme/vibrant-ink.css';
import 'codemirror/lib/codemirror.css';
import HelpPane from '../HelpComponent/helpPane';

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

    onReset() {
        this.state.game.resetLevel(this.state.game._currentLevel);
    }

    render() {
        return (
            <div id="container">
                <div id="panes">
                    <div id="screenPane">
                        {/* <canvas id="drawingCanvas"></canvas> */}
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
                            <span onClick={() => this.onReset()}>
                                <a id="resetButton" title="Ctrl+4: Reset Level">
                                    <span className="keys">^4</span> Reset
                                </a>
                            </span>
                        </div>
                    </div>
                    {/* <HelpPane></HelpPane> */}
                </div>
            </div>
        );
    }
}

export default App;