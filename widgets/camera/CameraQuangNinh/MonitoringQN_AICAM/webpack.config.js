/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');
const widgetConf = require('./widgetConf.json');

const APP_NAME = widgetConf.id;

module.exports = {
    entry: path.resolve(process.cwd(), 'widgets/camera/CameraQuangNinh/MonitoringQN_AICAM/index.jsx'),
    output: {
        path: path.resolve(process.cwd(), `dist/${APP_NAME}`),
        publicPath: '/',
        filename: `${APP_NAME}.js`,
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader'],

            },
            {
                test: /\.html$/,
                use: [{ loader: 'html-loader' }],
            },
            {
                test: /\.(png|jpg|svg|cur|gif|eot|svg|ttf|woff|woff2)$/,
                use: ['url-loader'],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['*', '.js', '.jsx'],
    },
    plugins: [
        new CopyWebpackPlugin(['./widgets/camera/CameraQuangNinh/MonitoringQN_AICAM/widgetConf.json']),
        new SimpleProgressWebpackPlugin(),
    ],
};
