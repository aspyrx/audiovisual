'use strict';

const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const config = require('./webpack.config.base.js');

config.mode = 'production';

if (!config.module) {
    config.module = {};
}

if (!config.plugins) {
    config.plugins = [];
}

config.plugins.push(
    new CleanWebpackPlugin({ verbose: true })
);

module.exports = config;

