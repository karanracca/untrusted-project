import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import axios from 'axios';
import './register.css';
import { API } from '../../scripts/config';


export default class Register extends Component {

    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: '',
            confirmPassword: '',
            fullname: '',
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ [event.target.name]: event.target.value })
    }

    handleSubmit(event) {
        event.preventDefault();
        if (this.state.username === "" || this.state.password === "" || this.state.confirmPassword === "" || this.state.fullname === "") {
            return;
        }
        API.post(`/users/createUser`, {
            username: this.state.username,
            password: this.state.password,
            fullname: this.state.fullname,
        }).then(response => {
            this.props.history.push(`/login`);  
        }).catch(error => {
            console.log(error);
        })
    }

    render() {
        return (
            <div className="login-page">
                <div className="form">
                    <form className="register-form">
                        <input type="text" placeholder="Username" name="username" onChange={this.handleChange} />
                        <input type="password" placeholder="Password" name="password" onChange={this.handleChange} />
                        <input type="password" placeholder="Confirm Password" name="confirmPassword" onChange={this.handleChange} />
                        <input type="text" placeholder="Fullname" name="fullname" onChange={this.handleChange} />
                        <button onClick={this.handleSubmit}>create</button>
                        <p className="message">Already registered? <Link to="/login">Sign In</Link></p>
                    </form>
                </div>
            </div>
        )
    }
}