import React, { Component } from "react";
import ROT from '../../rot';
import Game from '../../game';
import * as util from '../../util'
import { dirname } from "path";

class App extends Component {
    
    componentDidMount() {
        let startLevel = util.getParameterByName('lvl') ? parseInt(getParameterByName('lvl')) : null;
        let game = new Game(startLevel, "rotDisplay");
        console.log(game);
        game.initialize();

        // contentEditable is required for canvas elements to detect keyboard events
        game.display.getContainer().setAttribute("contentEditable", "true");
        
        document.getElementById("rotDisplay").appendChild(game.display.getContainer());

        
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