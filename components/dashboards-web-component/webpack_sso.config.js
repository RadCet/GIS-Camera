/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
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

module.exports = {
    context: path.resolve(__dirname, './src_sso'),
    entry: ['./App.jsx'],
    output: {
        path: path.resolve(__dirname, './dist/deloy/sso/'),
        filename: 'bundle.js',
        chunkFilename: '[name].bundle.js',
        publicPath: 'public/app/js/'
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                exclude: /node_modules/,
                use: ['html-loader'],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.(png|jpg|svg|cur|gif|eot|ttf|woff|woff2)$/,
                use: ['url-loader'],
            },
            {
                test: /\.jsx$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    // devServer: {
    //     contentBase: path.join(__dirname, 'public'),
    //     publicPath: '/dist/deloy/',
    // },
    // plugins: [
    //     // new CopyWebpackPlugin([
    //     //     {
    //     //         from: path.join(__dirname, 'vmsconfig.js'),
    //     //         to: 'vmsconfig.js'
    //     //     },
    //     // ]),
    //     // new SimpleProgressWebpackPlugin(),
    // ],
    // externals: {
    //     'Config': JSON.stringify(require('./vmsconfig.js'))
    // }
};
