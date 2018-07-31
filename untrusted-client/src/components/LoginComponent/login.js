import React, { Component } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import './login.css';

export default class Login extends Component {

    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: ''
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ [event.target.name]: event.target.value })
    }

    handleSubmit(event) {
        event.preventDefault();
        axios.post('http://localhost:63174/api/users/login', {
            username: this.state.username,
            password: this.state.password
        })
            .then(response => {     
                axios.get(`http://localhost:63174/api/level/${response.data.level}`).then(res => {
                    console.log(res);
                    localStorage.setItem('currentPlayer', JSON.stringify(response.data));
                    localStorage.setItem('currentPlayerLevel', JSON.stringify(res.data));
                    this.props.history.push(`/game`);
                });
            })
            .catch(error => {
                console.log(error);
            });
    }

    render() {
        return (
            <div className="login-page">
                <div className="form">
                    <form className="login-form">
                        <input type="text" placeholder="username" name="username" onChange={this.handleChange} />
                        <input type="password" placeholder="password" name="password" onChange={this.handleChange} />
                        <button onClick={this.handleSubmit}>login</button>
                        <p className="message">Not registered? <Link to="/register">Create an account</Link></p>
                    </form>
                </div>
            </div>
        )
    }
}