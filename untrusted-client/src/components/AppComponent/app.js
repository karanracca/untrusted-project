import React, { Component } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Login from "../LoginComponent/login";
import Register from "../RegisterUserComponent/register";
import Game from "../GameComponent/game";

class App extends Component {
    
    render() {
        return (
            <Router>
                <div>
                    <Route exact path="/" component={Login}/>
                    <Route path="/login" component={Login}/>
                    <Route path="/register" component={Register}/>
                    <Route path="/game" render={(props)=> (
                        localStorage.getItem('currentPlayer')? <Game {...props}/>: <Login {...props}/>
                    )}/>
                </div>
            </Router>
        );
    }
}

export default App;