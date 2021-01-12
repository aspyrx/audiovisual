'use strict';

const webpack = require('webpack');
const config = require('./webpack.config.base.js');
const ReactRefreshWebpackPlugin =
    require('@pmmmwh/react-refresh-webpack-plugin');

if (!config.performance) {
    config.performance = {};
}

config.performance.hints = false;

config.output.filename = '[name].js';

for (let rule of config.module.rules) {
    for (let use of rule.use) {
        if (use.loader !== 'babel-loader') {
            continue;
        }

        if (!use.options) {
            use.options = {};
        }

        if (!use.options.plugins) {
            use.options.plugins = [];
        }

        use.options.plugins.push('react-refresh/babel');
    }
}

config.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin()
);

module.exports = config;

