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
import * as config  from '../../scripts/config';
import Sound from "../../scripts/sound";

const appendInventory = (inventory, i) => {
    return(<span key={i} className="item" style={{color: inventory.color ? inventory.color : '#fff'}}>
        {inventory.symbol}
    </span>)
}

class App extends Component {

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
            sound: new Sound('local')
        }
    }

    componentDidMount() {
        window.ROT = ROT;
        let startLevel = this.state.user.level.levelNo;
        if (startLevel>1) this.setState({showEditor: true});
        let game = new Game(startLevel, "screen", this);
        this.setState({ game }, () => {
            this.state.game.initialize();
            // contentEditable is required for canvas elements to detect keyboard events
            this.state.game.display.getContainer().setAttribute("contentEditable", "true");
            document.getElementById("screen").appendChild(this.state.game.display.getContainer());
        });
    }

    levelComplete(currentLevel) {
        let options = {headers:{'Authorization': config.getAuthToken()}}
        axios.get(config.API.updateLevel, options).then(response => {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('currentPlayer', JSON.stringify(response.data.user));
            this.setState({user: JSON.parse(localStorage.getItem('currentPlayer'))})
                
            this.state.game.getLevel(response.data.user.level.levelNo, false, true);
            console.log(`Level ${currentLevel} complete, moving to ${response.data.user.level.levelNo + 1} level`);
        }).catch(error => {
            console.log(error);
        })
    }

    drawInventory() {
        //let inv = this.state.inventory.slice(0);
        //item = this.state.game.map.getObjectDefinition(item);
        //inv.push(item);
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
        this.setState({showEditor: true});
    }

    showPhone() {
        this.setState({showPhone: true});
    }

    usePhone() {
        this.state.game.usePhone();
    }

    displayChapter(message, cssClass) {
        this.setState({
            chapter: message,
            showChapter: true
        }, ()=> {
            setTimeout(function (that) {
                that.setState({
                    chapter: '',
                    showChapter: false
                })
            }, 2000, this);
        })
    }

    render() {

        const {showEditor, inventory, showPhone} = this.state;

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
            </div>: null}
            <div id="container">
                <div id="panes">
                    <div id="screenPane">
                        <div id="dummyDom"></div>
                        <div id="screen"></div>
                        <div id="inventory">
                        INVENTORY {inventory.map((item, i) => appendInventory(item, i))}
                        </div>
                        <div id="output"></div>
                        {this.state.showChapter?
                        <div id="chapter">
                            {this.state.chapter}
                        </div>:null
                        }
                    </div>
                    <div id="editorPane" style={{display: showEditor? 'block': 'none'}}>
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

                            <span className="editor-btn" onClick={() => this.openLeaderboard()}>
                                <a id="helpButton" title="Ctrl+1: API Reference">
                                    <span className="keys">^2</span> Leaderboard
                                </a>
                            </span>
                            {showPhone? <span className="editor-btn" onClick={() => this.usePhone()}>
                                <a id="phoneButton" title="Q: Use Phone">
                                    <span className="keys"> Q</span>Phone
                                </a>
                            </span> : null
                            }
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