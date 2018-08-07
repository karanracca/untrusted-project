import React, { Component } from "react";
import './helpPane.css';
import Reference from '../../scripts/reference'

class HelpPane extends Component {

    constructor() {
        super();
        this.state = {
            reference: Reference,
            commandList: [],
            categories: [],
            commands:[]
        }
    }

    static getDerivedStateFromProps(props, state) {
        let categories = [];
        let cl = [];
        props.help.map((command) => {
            let commandRef = state.reference[command];
            cl.push(commandRef);
            if (categories.indexOf(commandRef.category) == -1) {
                categories.push(commandRef.category);
            }
        });
        return {
            categories: categories,
            commandList: cl
        }
    }

    getCommands(cat) {
        let commands = this.state.commandList.filter(item => item.category === cat);
        this.setState({commands});
    }

    close() {
        this.props.close();
    }

    render() {
        return (
            <div id="helpPane">
                <div className="helpPaneSidebar">
                    <div className="helpPaneTitle">API Reference</div>
                    <ul>
                        {this.state.categories.map((c, i) => {
                            return <li onClick={()=> this.getCommands(c)} className="category" key={i}>{c}</li>
                        })}
                    </ul>
                </div>
                <div id="helpPaneContent">
                    {this.state.commands.length>0?<div>{
                        this.state.commands.map(c=>{
                            return(
                                <div className="command">
                                    <div className="commandTitle">{c.name}</div>
                                    <div className="commandDescription">{c.description}</div>
                                </div>
                            )
                        })
                    } 
                    </div>:null}
                    
                </div>
                <div id="helpPaneCloseButton" onClick={() => this.close()}>x</div>
            </div>
        );
    }
}

export default HelpPane;