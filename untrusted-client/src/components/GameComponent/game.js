import React, { Component } from "react";
import ROT from '../../scripts/rot';
import GameScript from '../../scripts/game';
import './game.css';
import 'codemirror/theme/vibrant-ink.css';
import 'codemirror/lib/codemirror.css';
import HelpPane from '../HelpComponent/helpPane';
import axios from 'axios';
import Leaderboard from "../LeaderboardComponent/leaderboard";
import * as config from '../../scripts/config';
import Loading from '../LoadingComponent/loading'
import MenuPane from "../MenuComponent/menuPane";

const appendInventory = (inventory, i) => {
    return (<span key={i} className="item" style={{ color: inventory.color ? inventory.color : '#fff' }}>
        {inventory.symbol}
    </span>)
}

class Game extends Component {

    constructor(props) {
        super(props);
        this.state = {
            inventory: [],
            game: {},
            showHelp: false,
            showLeaderboard: false,
            chapter: '',
            showEditor: false,
            showPhone: false,
            user: localStorage.getItem('currentPlayer') ? JSON.parse(localStorage.getItem('currentPlayer')) : props.history.push('/login'),
            laoding: false,
            showMenuPane: false
        }
    }

    componentDidMount() {
        window.ROT = ROT;
        let startLevel = this.state.user.level.levelNo;
        if (startLevel > 1) this.setState({ showEditor: true });
        let game = new GameScript(startLevel, "screen", this);
        this.setState({ game }, () => {
            this.state.game.initialize();
            // contentEditable is required for canvas elements to detect keyboard events
            this.state.game.display.getContainer().setAttribute("contentEditable", "true");
            document.getElementById("screen").appendChild(this.state.game.display.getContainer());
        });
    }

    fetchUserData() {
        let options = { headers: { 'Authorization': config.getAuthToken() } }
        this.setState({ laoding: true }, () => {
            axios.get(config.API.updateLevel, options).then(response => {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('currentPlayer', JSON.stringify(response.data.user));
                this.setState({ user: JSON.parse(localStorage.getItem('currentPlayer')), laoding: false })
            }).catch(error => {
                this.setState({ loading: false });
                console.log(error);
            })
        })
    }

    startNewGame() {
        let startLevel = this.state.user.level.levelNo;
        if (startLevel > 1) this.setState({ showEditor: true });
        let game = new GameScript(startLevel, "screen", this);

        this.setState({ game }, () => {
            this.state.game.initialize();
            // contentEditable is required for canvas elements to detect keyboard events
            this.state.game.display.getContainer().setAttribute("contentEditable", "true");
            //clear all child of node
            let node = document.getElementById("screen");
            while (node.firstChild) node.removeChild(node.firstChild);

            node = document.getElementById("editor");
            while (node.firstChild) node.removeChild(node.firstChild);
            document.getElementById("screen").appendChild(this.state.game.display.getContainer());
        });
    }

    levelComplete(currentLevel) {
        if (currentLevel < 10) {
            let options = { headers: { 'Authorization': config.getAuthToken() } }
            this.setState({ laoding: true }, () => {
                axios.get(config.API.updateLevel, options).then(response => {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('currentPlayer', JSON.stringify(response.data.user));
                    let lc = JSON.parse(localStorage.getItem('levelsCompleted'));
                    this.setState({ user: JSON.parse(localStorage.getItem('currentPlayer')), laoding: false })
                    this.state.game.getLevel(response.data.user.level.levelNo, false, true);
                    console.log(`Level ${currentLevel} complete, moving to ${response.data.user.level.levelNo + 1} level`);
                }).catch(error => {
                    this.setState({ loading: false });
                    console.log(error);
                })
            })

        } else if (currentLevel === 10) {
            this.props.history.push('/winner');
        }
    }

    resetGame() {
        let options = { headers: { 'Authorization': config.getAuthToken() } }
        this.setState({ laoding: true }, () => {
            axios.get(config.API.reset, options).then(response => {
                // this.fetchUserData();
                // this.startNewGame();
                // this.setState({ loading: false });
                // console.log(response)
                this.props.history.push("/login");
            }).catch(error => {
                this.setState({ loading: false });
                console.log(error);
            })
        });
    }

    drawInventory() {
        let inv = this.state.game.inventory;
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
        localStorage.clear();
        this.props.history.push('/login');
    }

    showEditor() {
        this.setState({ showEditor: true }, () => {
            this.state.game.editor.refresh()
        });
    }

    showPhone() {
        this.setState({ showPhone: true });
    }

    usePhone() {
        this.state.game.usePhone();
    }

    openMenuPane() {
        this.setState({ showMenuPane: true });
    }

    closeMenuPane() {
        this.setState({ showMenuPane: false });
    }

    displayChapter(message, cssClass) {
        this.setState({
            chapter: message,
            showChapter: true
        }, () => {
            setTimeout(function (that) {
                that.setState({
                    chapter: '',
                    showChapter: false
                })
            }, 2000, this);
        })
    }

    render() {

        const { showEditor, inventory, showPhone, loading } = this.state;
        if (!loading) {
            return (<div>
                {this.state.user !== null ?
                    <div className="welcome-user">
                        <span>Hi, {this.state.user.fullname}</span>
                    </div> : null}


                <div className="main-title">
                    <span>The Advantures of Dr. Eval</span>
                </div>

                {this.state.user !== null ? <div>
                    <span className="user-level">Level-{this.state.user.level.levelNo}</span>
                    <span className="user-score">Score-{this.state.user.score}</span>
                </div> : null}
                <div id="container">
                    <div id="panes">
                        <div id="screenPane">
                            <div id="dummyDom"></div>
                            <div id="screen"></div>
                            <div id="inventory">
                                INVENTORY {inventory.map((item, i) => appendInventory(item, i))}
                            </div>
                            <div id="output"></div>
                            {this.state.showChapter ?
                                <div id="chapter">
                                    {this.state.chapter}
                                </div> : null
                            }
                        </div>
                        <div id="editorPane" style={{ display: showEditor ? 'block' : 'none' }}>
                            <textarea id="editor"></textarea>
                            <div id="buttons">
                                <span className="editor-btn" onClick={() => this.onExecute()}>
                                    <a id="executeButton" title="Ctrl+5: Execute">
                                        <span className="keys">^5</span> Execute
                                </a>
                                </span>
                                <span className="editor-btn" onClick={() => this.onReset()}>
                                    <a id="resetButton" title="Ctrl+4: Reset Level">
                                        <span className="keys">^4</span> Reset
                                </a>
                                </span>
                                <span className="editor-btn" onClick={() => this.openHelp()}>
                                    <a id="helpButton" title="Ctrl+1: API Reference">
                                        <span className="keys">^1</span> API
                                </a>
                                </span>
                                {showPhone ? <span className="editor-btn" onClick={() => this.usePhone()}>
                                    <a id="phoneButton" title="Q: Use Phone">
                                        <span className="keys"> Q</span>Phone
                                </a>
                                </span> : null
                                }
                                <span className="editor-btn" style={{float: 'right'}} onClick={() => this.openLeaderboard()}>
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

                <span onClick={() => { this.resetGame() }} className="reset-btn"><a>Reset Game</a></span>
            </div>);
        } else {
            return (<Loading />)
        }
    }
}

export default Game;