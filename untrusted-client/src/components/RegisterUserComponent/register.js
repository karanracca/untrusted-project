import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import './register.css';
import axios from 'axios';
import { API } from '../../scripts/config';
import Loading from '../LoadingComponent/loading';

export default class Register extends Component {

    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: '',
            confirmPassword: '',
            fullname: '',
            showError: false,
            error: '',
            loading: false
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ [event.target.name]: event.target.value })
    }

    handleSubmit(event) {
        event.preventDefault();
        if (this.state.username === "" || this.state.password === "" || this.state.fullname === "") {
            return;
        }
        this.setState({loading: true});
        axios.post(API.register, {
            username: this.state.username,
            password: this.state.password,
            fullname: this.state.fullname,
        }).then(response => {
            this.setState({loading: false});
            if (response.status === 200) {
                this.setState({showError: false});
                this.props.history.push(`/login`);
            } else {
                throw response;
            }
        }).catch(error => {
            this.setState({loading: false});
            console.log(error);
            this.setState({showError: true, error: error.response && error.response.data || "Something went wrong, please try again" })  
        })
    }

    render() {

        const { error, showError , loading} = this.state;
        if (!loading) {
        return (
            <div id="notepadPane" className='pop-up-box'>
                <div className="popup-box-heading">$CREATE ACCOUNT</div>
                <form className="login-form">
                    <div className="input-box">
                        <label htmlFor="fullname">Fullname</label>
                        <input type="text" placeholder="fullname" name="fullname" onChange={this.handleChange} />
                    </div>

                    <div className="input-box">
                        <label htmlFor="username">Username</label>
                        <input type="text" placeholder="username" name="username" onChange={this.handleChange} />
                    </div>

                    <div>
                        <label htmlFor="username">Password</label>
                        <input type="password" placeholder="password" name="password" onChange={this.handleChange} />
                    </div>

                    <p className="create-account-message">Already registered? <Link to="/login">Sign In</Link></p>

                    <button className="popup-box-button" onClick={this.handleSubmit} id='notepadSaveButton'>Create Account</button>

                    {showError ? <div>
                        <span className="error">{error}</span>
                    </div> : null}
                </form>
            </div>
        )
    } else {
        return(<Loading />)
    }
    }
}