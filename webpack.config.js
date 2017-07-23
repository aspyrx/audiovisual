'use strict';

const config = require('./webpack.config.base.js');

if (!config.module) {
    config.module = {};
}

if (!config.module.rules) {
    config.module.rules = [];
}

config.module.rules.push(
    {
        test: /\.js$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: ['eslint-loader']
    }
);

if (!config.performance) {
    config.performance = {};
}

config.performance.hints = false;

module.exports = config;

