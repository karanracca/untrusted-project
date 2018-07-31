import React, { Component } from "react";
import './helpPane.css';
import Reference from '../../scripts/reference'

class HelpPane extends Component {

    constructor() {
        super();
        this.state = {
            reference: Reference,
            categories: [],
            commands:[]
        }
    }

    static getDerivedStateFromProps(props, state) {
        let categories = [];
        props.help.map((command) => {
            let commandRef = state.reference[command];

            if (categories.indexOf(commandRef.category) == -1) {
                categories.push(commandRef.category);
            }

        });
        return {
            categories: categories
        }
    }

    getCommands(cat) {
        let commands = this.props.help.filter(item => item.category === cat);
    }

    render() {
        return (
            <div id="helpPane">
                <div id="helpPaneSidebar">
                    <div id="helpPaneTitle">API Reference</div>
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
                <div id="helpPaneCloseButton">x</div>
            </div>
        );
    }
}

export default HelpPane;