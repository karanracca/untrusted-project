import React, { Component } from "react";
import './login.css';
import { Link } from "react-router-dom";
import axios from 'axios';
import { API } from '../../scripts/config';
import Loading from '../LoadingComponent/loading';

export default class Login extends Component {

    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: '',
            showError: false,
            error: '',
            loading: false
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        //if(localStorage.getItem('currentPlayer')?this.props.history.push(`/game`):console.log('Login'));
    }
    
    handleChange(event) {
        this.setState({ [event.target.name]: event.target.value })
    }

    handleSubmit(event) {
        event.preventDefault();
        if (this.state.username === '' || this.state.password === '') return;
        this.setState({loading: true});
        axios.post(API.login, {
            username: this.state.username,
            password: this.state.password
        }).then(response => {
            this.setState({showError:false, loading: false});
            //Store token and user object for further use
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('currentPlayer', JSON.stringify(response.data.user));
            localStorage.setItem('levelsCompleted', JSON.stringify([]));
            this.props.history.push(`/game`);
        }).catch(error => {
            this.setState({loading: false});
            console.log(error);
            if (error.response.status === 404) {
                this.setState({showError:true, error: "Incorrect username or password"})
            } else {
                this.setState({showError:true, error: "Something went wrong please try again!"})
            }
        });
    }

    render() {

        const {error, showError, loading} = this.state;

        if (!loading) {
        return (<div id="notepadPane" className='pop-up-box'>
            <div className="popup-box-heading">$LOGIN</div>
            <form className="login-form">
                <div className="input-box">
                    <label htmlFor="username">Username</label>
                    <input type="text" placeholder="username" name="username" onChange={this.handleChange} />
                </div>

                <div>
                    <label htmlFor="username">Password</label>
                    <input type="password" placeholder="password" name="password" onChange={this.handleChange} />
                </div>

                <p className="create-account-message">Not registered? <Link to="/register">Create an account</Link></p>

                <button className="popup-box-button" onClick={this.handleSubmit} id='notepadSaveButton'>Login</button>

                {showError? <div>
                    <span className="error">{error}</span>
                </div>:null}
            </form>
        </div>)
        } else {
            return(<Loading />)
        }
    }
}