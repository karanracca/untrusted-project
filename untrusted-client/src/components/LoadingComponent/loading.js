import React, { Component } from "react";

const Style = {
    position: 'inherit',
    margin: 'auto',
    marginTop: '5%',
    height: '30px',
    width: '300px',
    top: '60px',
    left: '350px',
    zIndex: '9000',
    background: 'black',
    border: '2px solid yellow',
    padding: '2%',
    textAlign: 'center',
    color: 'yellow',
    fontSize: '1rem'
}

export default class Loading extends Component {
    render() {
        return (<div style={Style}>
            $Fetching Data...
    </div>)
    }
}