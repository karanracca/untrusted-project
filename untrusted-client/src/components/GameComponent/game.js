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
import { APIUnused } from '../../scripts/config';
import * as config  from '../../scripts/config';


class App extends Component {

    constructor() {
        super();
        this.state = {
            inventory: [],
            game: {},
            showHelp: false,
            showLeaderboard: false,
            user: localStorage.getItem('currentPlayer') ? JSON.parse(localStorage.getItem('currentPlayer')) : null
        }
    }

    componentDidMount() {
        window.ROT = ROT;
        let startLevel = this.state.user.level.levelNo;
        let game = new Game(startLevel, "screen", this);
        this.setState({ game }, () => {
            this.state.game.initialize();
            // contentEditable is required for canvas elements to detect keyboard events
            this.state.game.display.getContainer().setAttribute("contentEditable", "true");
            document.getElementById("screen").appendChild(this.state.game.display.getContainer());
        });
    }

    levelComplete(currentLevel) {
        let options = {
            headers: {
                'Authorization': config.getAuthToken()
            }
        }
        axios.get(APIUnused.updateLevel, options).then(response => {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('currentPlayer', JSON.stringify(response.data.user));
            this.setState({user: JSON.parse(localStorage.getItem('currentPlayer'))})
                
            this.state.game.getLevel(response.data.user.level.levelNo, false, true);
            console.log(`Level ${currentLevel} complete, moving to ${response.data.user.level.levelNo + 1} level`);
        }).catch(error => {
            console.log(error);
        })
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
        this.setState({ showLeaderboard: true })
    }

    closeLeaderboard() {
        this.setState({ showLeaderboard: false });
    }

    logout() {
        this.props.history.push('/login');
    }

    render() {
        return (<div>
            {this.state.user !== null ?
                <div className="welcome-user">
                    <span>Hi, {this.state.user.fullname}</span>
                </div> : null}


            <div className="main-title">
                <span>Hack The Maze!</span>
            </div>
            {this.state.user !== null ? <div>
                <span className="user-level">Level- {this.state.user.level.levelNo}</span>
                <span className="user-score">Score- {this.state.user.score}</span>
            </div>: null}
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
            <span onClick={() => { this.logout() }} className="logout-btn"><a>Logout</a></span>
        </div>);
    }
}

export default App;