import React, { Component } from "react";
import './winner.css';
import { Link } from "react-router-dom";
import axios from 'axios';
import { API } from '../../scripts/config';

export default class Winner extends Component {

    constructor(props) {
        super(props)
        this.state = {
        }
    }

    handleSubmit(event) {
        event.preventDefault();
        if (this.state.username === '' || this.state.password === '') return;
        axios.post(API.login, {
            username: this.state.username,
            password: this.state.password
        }).then(response => {
            this.setState({showError:false});
            //Store token and user object for further use
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('currentPlayer', JSON.stringify(response.data.user));
            this.props.history.push(`/game`);
        }).catch(error => {
            console.log(error);
            if (error.response.status === 404) {
                this.setState({showError:true, error: "Incorrect username or password"})
            } else {
                this.setState({showError:true, error: "Something went wrong please try again!"})
            }
        });
    }

    render() {

        

        return (<div id="notepadPane" className='pop-up-box'>
            <div className="popup-box-heading">$Congratulations!! You have completed all 10 levels.</div>
            <div>
                We are in the process of adding more levels. Be ready!!
            </div>
        </div>)
    }
}