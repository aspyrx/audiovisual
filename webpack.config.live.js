'use strict';

const config = require('./webpack.config.base.js');

config.optimization.runtimeChunk = 'single';
config.optimization.moduleIds = 'named';

if (!config.performance) {
    config.performance = {};
}

config.performance.hints = false;

config.output.filename = '[name].js';

config.entry.main.unshift(
    'webpack-dev-server/client?http://localhost:8080/',
    'webpack/hot/dev-server'
);

module.exports = config;

