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

import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import DashboardThumbnail from '../utils/DashboardThumbnail';
import AuthManager from './utils/AuthManager';
import Cookies from "js-cookie";

/**
 * Logout.
 */
export default class Logout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            redirectToLogin: false
        }
    }

    componentDidMount() {
        DashboardThumbnail.deleteDashboardThumbnails();
        import(/* webpackChunkName: "vmsconfig" */ '../vmsconfig').then(({ default: vmsConfig }) => {
            AuthManager.logout()
                .then(() => localStorage.clear())
                .then(() => {
                    if (vmsConfig.authentication_without_token == true) {
                        window.location.href = `${window.location.origin}/vms/logoutSSO`;
                    }
                })
                .then(() => this.setState({ redirectToLogin: true }))
        });
    }

    /**
     * Renders logout component.
     * @returns {XML} HTML content
     */
    render() {
        if (this.state.redirectToLogin) {
            return <Redirect to={{ pathname: '/login' }} />;
        }
        return null;
    }
}
