import React, { Component } from "react";
import ROT from '../../rot';
import Game from '../../game';
import * as util from '../../util'
import { dirname } from "path";

class App extends Component {
    
    componentDidMount() {
        let startLevel = util.getParameterByName('lvl') ? parseInt(getParameterByName('lvl')) : null;
        let game = new Game(true, startLevel);
        console.log(game);
        game.initialize();

        // contentEditable is required for canvas elements to detect keyboard events
        game.rotDisplay.__getDisplay.getContainer().setAttribute("contentEditable", "true");
        
        document.getElementById("rotDisplay").appendChild(game.rotDisplay.__getDisplay.getContainer());

        document.getElementById("rotDisplay").addEventListener("keydown", (e) => util.setEventHandler(e, game));
    }

    render() {
        return (
            <div>
                {console.log(ROT)}
                <h1>Basic React Bootstrap</h1>
                <div id="rotDisplay">

                </div>

                <div>
                    <textarea id="editor">
                    
                    </textarea>
                </div>
            </div>
        );
    }
}

export default App;