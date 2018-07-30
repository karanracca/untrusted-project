import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import axios from 'axios';
import './register.css';


export default class Register extends Component {

    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ [event.target.name]: event.target.value })
    }

    handleSubmit(event) {
        event.preventDefault();
        axios.post('http://localhost:63174/api/users/CreateUser', {
            username: this.state.username,
            password: this.state.password,
            firstName: this.state.firstName,
            lastName: this.state.lastName,
            email: this.state.email,
            phone: this.state.phone
        }).then(response => {
            this.props.history.push(`/login`); 
            console.log(response) 
        });
    }

    render() {
        return (
            <div className="login-page">
                <div className="form">
                    <form className="register-form">
                        <input type="text" placeholder="username" name="username" onChange={this.handleChange} />
                        <input type="password" placeholder="password" name="password" onChange={this.handleChange} />
                        <input type="text" placeholder="First Name" name="firstName" onChange={this.handleChange} />
                        <input type="text" placeholder="Last Name" name="lastName" onChange={this.handleChange} />
                        <input type="text" placeholder="Email Id" name="email" onChange={this.handleChange} />
                        <input type="text" placeholder="Phone Number" name="phone" onChange={this.handleChange} />
                        <button onClick={this.handleSubmit}>create</button>
                        <p className="message">Already registered? <Link to="/login">Sign In</Link></p>
                    </form>
                </div>
            </div>
        )
    }
}