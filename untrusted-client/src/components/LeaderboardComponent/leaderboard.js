import React, { Component } from "react";
import './leaderboard.css';
import axios from 'axios';
import * as config  from '../../scripts/config';

class Leaderboard extends Component {

    constructor() {
        super();
        this.state = {
            leaderboard: []
        }
    }

    componentDidMount() {
        let options = {headers:{'Authorization': config.getAuthToken()}}
        axios.get(config.API.leaderboard, options).then(res => {
            if (res.status === 200)
            this.setState({ leaderboard: res.data })
        }).catch(err => {
            console.log(err);
        });
    }

    close() {
        this.props.close();
    }

    render() {
        return (
            <div id="helpPane">
                <div id="helpPaneSidebar"></div>
                <div id="helpPaneContent">
                    <div id="helpPaneTitle">Leaderboard</div>
                    <table>
                        <tr><th>Name</th><th>Level</th><th>Score</th></tr>
                        {this.state.leaderboard.map((player, i) => {
                            return (<tr key={i}>
                                <td>{player.fullname}</td>
                                <td>{player.level}</td>
                                <td>{player.score}</td>
                            </tr>)
                        })}
                    </table>
                </div>
                <div id="helpPaneCloseButton" onClick={() => this.close()}>x</div>
            </div>
        );
    }
}

export default Leaderboard;