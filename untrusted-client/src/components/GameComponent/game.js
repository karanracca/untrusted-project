import React, { Component } from "react";
import ROT from '../../scripts/rot';
import Game from '../../scripts/game';
import * as util from '../../scripts/util'
import './game.css';
import 'codemirror/theme/vibrant-ink.css';
import 'codemirror/lib/codemirror.css';
import HelpPane from '../HelpComponent/helpPane';
import axios from 'axios';
import Leaderboard from "../LeaderboardComponent/leaderboard";

class App extends Component {

    constructor() {
        super();
        this.state = {
            inventory: [],
            game: {},
            showHelp: false,
            showLeaderboard: false
        }
    }

    componentDidMount() {
        window.ROT = ROT;
        //let startLevel = util.getParameterByName('lvl') ? parseInt(getParameterByName('lvl')) : null;
        let startLevel = JSON.parse(localStorage.getItem('currentPlayerLevel')).levelNo;
        let game = new Game(startLevel, "screen", this);
        this.setState({ game }, () => {
            //console.log(game);
            this.state.game.initialize();
            //this.state.game.start(1);
            // contentEditable is required for canvas elements to detect keyboard events
            this.state.game.display.getContainer().setAttribute("contentEditable", "true");
            document.getElementById("screen").appendChild(this.state.game.display.getContainer());
        });
    }

    levelComplete(currentLevel) {
        axios.post('http://localhost:63174/api/users/updateStats',
            JSON.parse(localStorage.getItem('currentPlayer'))).then(res => {
                localStorage.setItem('currentPlayer', JSON.stringify(res.data));
                this.state.game.getLevel(res.data.level, false, true);
                console.log(`Level ${currentLevel} complete, moving to ${currentLevel + 1} level`);
            });
        //this.getLevel(this._currentLevel + 1, false, true); just temp refrence 
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

    openHelp() {
        this.setState({ showHelp: true });
    }

    closeHelp() {
        this.setState({ showHelp: false });
    }

    openLeaderboard() {
        this.setState({showLeaderboard: true})
    }

    closeLeaderboard() {
        this.setState({ showLeaderboard: false });
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
                            <span onClick={() => this.openHelp()}>
                                <a id="helpButton" title="Ctrl+1: API Reference">
                                    <span className="keys">^1</span> API
                                </a>
                            </span>

                            <span onClick={() => this.openLeaderboard()}>
                                <a id="helpButton" title="Ctrl+1: API Reference">
                                    <span className="keys">^2</span> Leaderboard
                                </a>
                            </span>
                        </div>
                    </div>
                    {this.state.showHelp && this.state.game.helpCommands ? <HelpPane help={this.state.game.helpCommands} close={this.closeHelp.bind(this)}></HelpPane> : null}

                    {this.state.showLeaderboard ? <Leaderboard close={this.closeLeaderboard.bind(this)}></Leaderboard> : null}
                </div>
            </div>
        );
    }
}

export default App;