/*
 *  Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import { Checkbox, RaisedButton, Snackbar, TextField } from "material-ui";
import { MuiThemeProvider } from "material-ui/styles";
import Qs from "qs";
import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import PropTypes from "prop-types";
import FormPanel from "../common/FormPanel";

import { FormattedMessage } from "react-intl";

import AuthManager from "./utils/AuthManager";
// import Header from '../common/Header';
import defaultTheme from "../utils/Theme";

import EncryptHelper from "./utils/CryptToken/Helper";
import Cookies from "js-cookie";

import axios from "axios";
import {localStoragePersistentHandler as defaultPersistentHandler} from './utils/CryptToken/PersistentHelper'

/**
 * Style constants.
 */
const styles = {
    cookiePolicy: {
        padding: "10px",
        fontFamily: defaultTheme.fontFamily,
        border: "1px solid #8a6d3b",
        color: "#8a6d3b"
    },
    cookiePolicyAnchor: { fontWeight: "bold", color: "#8a6d3b" }
};

/**
 * Login page.
 */
export default class Login extends Component {
    /**
     * Constructor.
     *
     * @param {{}} props Props
     */
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: "",
            authenticated: false,
            rememberMe: false,
            referrer: "/"
        };
        this.authenticate = this.authenticate.bind(this);
        this.writeCookie = this.writeCookie.bind(this);
        this.readCookie = this.readCookie.bind(this);
        this.allowPassLoginWSO2 = this.allowPassLoginWSO2.bind(this);
        this.showError = this.showError.bind(this);
        this.encryptHelper = null;
        console.log("Login:-------------v4--------------");
    }

    /**
     * Extract the referrer and check whether the user logged-in.
     */

    componentDidMount() {
        // Extract referrer from the query string.
        const queryString = this.props.location.search.replace(/^\?/, "");
        // console.log("queryString:" + queryString);
        const params = Qs.parse(queryString);
        // console.log("params:" + JSON.stringify(params));
        this.encryptHelper = new EncryptHelper(defaultPersistentHandler);
        import(/* webpackChunkName: "vmsconfig" */ '../vmsconfig').then(({ default: vmsConfig }) => {
            if (vmsConfig.authentication_without_token == true) {
                let loginUserName = "admincamera";
                // TODO UPDATE loginusername
                let ssoUserInfoString = Cookies.get("ssouser");
                let ssoUserInfo = ssoUserInfoString ? JSON.parse(ssoUserInfoString) : null;
                console.log(`ssouser:${ssoUserInfo}`);
                if (ssoUserInfo) {
                    const {username} = ssoUserInfo;
                    if (username && username.length > 0) {
                        loginUserName = username;
                    }
                }
                if (params.referrer) {
                    const paramsTmp = params.referrer.split("?");
                    this.state.referrer = paramsTmp[0];
                }
                this.setState({
                    username: loginUserName
                });
                Cookies.set("VMSINFO", {});//, { expires: 7, path: '/portal' });
                this.allowPassLoginWSO2(loginUserName);
                // If the user already logged in set the state to redirect user to the referrer page.
                if (AuthManager.isLoggedIn()) {
                    this.state.authenticated = true;
                }
            } else {
                let tokenRequest = params.token;
                if (tokenRequest) {
                } else if (params.referrer) {
                    const paramsTmp = params.referrer.split("?");
                    this.state.referrer = paramsTmp[0];
                    if (paramsTmp.length > 1) {
                        let urlTmp = "http://bkav.com?" + paramsTmp[1];
                        let url = new URL(urlTmp);
                        const token = url.searchParams.get("token");
                        urlTmp = "http://bkav.com?" + paramsTmp[2];
                        url = new URL(urlTmp);
                        const accountName = url.searchParams.get("account");
                        let username = "admincamera";
                        let password = "";
                        if (token) {
                            const tokenArr = token.split("-");
                            // Lưu voice search
                            if (tokenArr.length > 1) {
                                const voiceSearch = tokenArr[1];
                                window.voiceSerch = voiceSearch;
                            }

                            // Đăng nhập với token
                            const tokenStr = tokenArr[0];
                            tokenRequest = tokenStr;
                        }

                    }
                }
                if (tokenRequest == null) return;
                try {
                    let userTokenData = null;
                    try {
                        userTokenData = JSON.parse(EncryptHelper.decodeKey2(tokenRequest));
                        // const {username, password} = userTokenData;
                        // if (userTokenData == null || userTokenData.username == null || userTokenData.password == null) {
                        //     throw new Error();
                        // }
                    } catch (error) {
                        console.error("decodeKey2:" + error);
                        userTokenData = JSON.parse(EncryptHelper.decodeKey3(tokenRequest));
                    }
                    const {username, password} = userTokenData;
                    if (username == null || username.length === 0 || password == null || password.length === 0) {
                        return;
                    }
                    let vms_current = {
                        username: username,
                        password: password,
                        auth: null,
                        id: null,
                        protocol: null,
                        ip: null,
                        port: null
                    };
                    const {vms_protocol, vms_domain, vms_port, vms_login_api_template} = vmsConfig;
                    const vms_login_api = vms_login_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
                    vms_current.protocol = vms_protocol;
                    vms_current.ip = vms_domain;
                    vms_current.port = vms_port;
                    return axios.post(vms_login_api, { user: username, pass: password  }).then(res => {
                        vms_current.auth = res.data;
                        let now = new Date().getTime();
                        vms_current.auth.token_time_update = now;
                        vms_current.auth.refresh_time_update = now;
                        this.encryptHelper.saveToPersistence("current_vms",vms_current, 7);
                        //marked login by vms success using in AuthManager
                        Cookies.set("VMSINFO", {});//, { expires: 7, path: '/portal' });
                        this.allowPassLoginWSO2(username);
                    }).catch(this.showError);
                } catch (error) {
                    const errorMessage = this.context.intl.formatMessage({
                        id: "login.unknown.error",
                        defaultMessage: "Unknown error occurred!"
                    });
                    this.setState({
                        username: "",
                        password: "",
                        error: errorMessage,
                        showError: true
                    });
                }

                // If the user already logged in set the state to redirect user to the referrer page.
                if (AuthManager.isLoggedIn()) {
                    this.state.authenticated = true;
                }
            }
        });
    }

    /**
     * Refresh the access token when the browser session is restored.
     */
    componentWillMount() {
        if (AuthManager.isRememberMeSet() && !AuthManager.isLoggedIn()) {
            AuthManager.authenticateWithRefreshToken().then(() =>
                this.setState({ authenticated: true })
            );
        }
    }

    /**
     * Call authenticate API and authenticate the user.
     *
     * @param {{}} e event
     */
    authenticate(e) {
        e.preventDefault();

        import(/* webpackChunkName: "vmsconfig" */ '../vmsconfig').then(({ default: vmsConfig }) => {
            if (vmsConfig.authentication_without_token == true) {
                let loginUserName = "admincamera";
                Cookies.set("VMSINFO", {});//, { expires: 7, path: '/portal' });
                // TODO UPDATE loginusername
                let ssoUserInfoString = Cookies.get("ssouser");
                let ssoUserInfo = ssoUserInfoString ? JSON.parse(ssoUserInfoString) : null;
                console.log(`ssouser:${ssoUserInfo}`);
                if (ssoUserInfo) {
                    const {username} = ssoUserInfo;
                    if (username && username.length > 0) {
                        loginUserName = username;
                    }
                }
                this.allowPassLoginWSO2(loginUserName);
            } else {
                let username = document.querySelector("#usernameLogin").value;
                let password = document.querySelector("#passwordLogin").value;
                let vms_current = {
                    username: username,
                    password: password,
                    auth: null,
                    id: null,
                    protocol: null,
                    ip: null,
                    port: null
                };
                const {vms_protocol, vms_domain, vms_port, vms_login_api_template} = vmsConfig;
                const vms_login_api = vms_login_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
                vms_current.protocol = vms_protocol;
                vms_current.ip = vms_domain;
                vms_current.port = vms_port;
                return axios.post(vms_login_api, { user: username, pass: password  }).then(res => {
                        vms_current.auth = res.data;
                        let now = new Date().getTime();
                        vms_current.auth.token_time_update = now;
                        vms_current.auth.refresh_time_update = now;
                        this.encryptHelper.saveToPersistence("current_vms",vms_current, 7);
                        //marked login by vms success using in AuthManager
                        Cookies.set("VMSINFO", {});//, { expires: 7, path: '/portal' });
                        this.allowPassLoginWSO2(username);
                    }).catch(this.showError);
            }
        });
    }

    allowPassLoginWSO2(username = null) {
        AuthManager.authenticate("admin", "123456", this.state.rememberMe)
            .then(() => {
                this.setState({ authenticated: true })
            })
            .then(() => {
                if (username != null && username.length > 0) {
                    let currentUser = AuthManager.getUser();
                    currentUser.username = username;
                    AuthManager.setUser(currentUser);
                }
            })
            .catch(error => this.showError(error));
    }

    showError(error) {
        const errorMessage =
            error.response && error.response.status === 401
                ? this.context.intl.formatMessage({
                    id: "login.error.message",
                    defaultMessage: "Invalid username/password!"
                })
                : this.context.intl.formatMessage({
                    id: "login.unknown.error",
                    defaultMessage: "Unknown error occurred!"
                });
        this.setState({
            username: "",
            password: "",
            error: errorMessage,
            showError: true
        });
    }

    writeCookie(name, value, days = 3) {
        var date, expires;
        if (days) {
            date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = "; expires=" + date.toGMTString();
        } else {
            expires = "";
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    };

    readCookie(name) {
        var i,
            c,
            ca,
            nameEQ = name + "=";
        ca = document.cookie.split(";");
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) == " ") {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) == 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return "";
    }

    /**
     * Renders the login page.
     *
     * @return {XML} HTML content
     */
    render() {
        // If the user is already authenticated redirect to referrer link.
        if (this.state.authenticated) {
            return <Redirect to={this.state.referrer} />;
        }

        return (
            <MuiThemeProvider muiTheme={defaultTheme}>
                <div>
                    {/*<Header*/}
                    {/*title={<FormattedMessage id='portal.title' defaultMessage='Portal' />}*/}
                    {/*rightElement={<span />}*/}
                    {/*/>*/}
                    <FormPanel
                        title={<FormattedMessage id="login.title" defaultMessage="Login" />}
                        onSubmit={this.authenticate}
                    >
                        <TextField
                            id="usernameLogin"
                            autoFocus
                            fullWidth
                            autoComplete="off"
                            floatingLabelText={
                                <FormattedMessage
                                    id="login.username"
                                    defaultMessage="Username"
                                />
                            }
                            // value={this.state.username}
                            onChange={e => {
                                this.setState({
                                    username: e.target.value
                                });
                            }}
                        />
                        <br />
                        <TextField
                            fullWidth
                            id="passwordLogin"
                            type="password"
                            autoComplete="off"
                            floatingLabelText={
                                <FormattedMessage
                                    id="login.password"
                                    defaultMessage="Password"
                                />
                            }
                            // value={this.state.password}
                            onChange={e => {
                                this.setState({
                                    password: e.target.value
                                });
                            }}
                        />
                        <br />
                        <Checkbox
                            label={
                                <FormattedMessage
                                    id="login.rememberMe"
                                    defaultMessage="Remember Me"
                                />
                            }
                            id="rememberLogin"
                            checked={this.state.rememberMe}
                            onCheck={(e, checked) => {
                                this.setState({
                                    rememberMe: checked
                                });
                            }}
                            style={{ margin: "30px 0" }}
                        />
                        <br />
                        <RaisedButton
                            id="buttonLogin"
                            primary
                            type="submit"
                            disabled={
                                this.state.username === "" || this.state.password === ""
                            }
                            label={
                                <FormattedMessage id="login.title" defaultMessage="Login" />
                            }
                            disabledBackgroundColor="rgb(27, 40, 47)"
                        />
                        <br />
                        <br />
                        {/*<div style={styles.cookiePolicy}>*/}
                        {/*<div>*/}
                        {/*<FormattedMessage*/}
                        {/*id="login.cookie.policy.before"*/}
                        {/*defaultMessage="After a successful sign in, we use a cookie in your browser to*/}
                        {/*track your session. You can refer our "*/}
                        {/*/>*/}
                        {/*<a*/}
                        {/*style={styles.cookiePolicyAnchor}*/}
                        {/*href="/policies/cookie-policy"*/}
                        {/*target="_blank"*/}
                        {/*>*/}
                        {/*<FormattedMessage id="login.cookie.policy" defaultMessage="Cookie Policy"/>*/}
                        {/*</a>*/}
                        {/*<FormattedMessage id="login.cookie.policy.after" defaultMessage=" for more details."/>*/}
                        {/*</div>*/}
                        {/*</div>*/}
                        {/*<br />*/}
                        {/*<div style={styles.cookiePolicy}>*/}
                        {/*<div>*/}
                        {/*<FormattedMessage*/}
                        {/*id="login.privacy.policy.before"*/}
                        {/*defaultMessage="By signing in, you agree to our "*/}
                        {/*/>*/}
                        {/*<a*/}
                        {/*style={styles.cookiePolicyAnchor}*/}
                        {/*href="/policies/privacy-policy"*/}
                        {/*target="_blank">*/}
                        {/*<FormattedMessage id="login.privacy.policy" defaultMessage="Privacy Policy"/>*/}
                        {/*</a>*/}
                        {/*<FormattedMessage id="login.privacy.policy.after" defaultMessage="."/>*/}
                        {/*</div>*/}
                        {/*</div>*/}
                    </FormPanel>
                    <Snackbar
                        message={this.state.error}
                        open={this.state.showError}
                        autoHideDuration="4000"
                        onRequestClose={() =>
                            this.setState({ error: "", showError: false })
                        }
                    />
                </div>
            </MuiThemeProvider>
        );
    }
}

Login.contextTypes = {
    intl: PropTypes.object.isRequired
};