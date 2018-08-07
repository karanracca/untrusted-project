import React, { Component } from "react";
import './menuPane.css';
import {levelFileNames} from '../../scripts/config';

class MenuPane extends Component {

    constructor(props) {
        super(props);
        
    }

    close() {
        this.props.close();
    }

    render() {
        const {levelReached, levelSelected} = this.props;


        return (<div id="menuPane" className='popup-box'>
        <div className="popup-box-heading">$LEVELS</div>
        {levelFileNames.map((lvl,i) => {
            let lvlno = i+1;
            if (lvlno <= levelReached) {
                let levelName = lvl.split('.')[0];
                levelName = levelName.split('_').join(' ');
                return(<button key={i} onClick={() => levelSelected(lvlno)}>{levelName}</button>)
            }
        })}
        <div className="closeButton" onClick={() => this.close()}>x</div>
    </div>);
    }
}

export default MenuPane;