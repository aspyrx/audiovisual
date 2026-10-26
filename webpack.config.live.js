'use strict';

const config = require('./webpack.config.base.js');

config.optimization.runtimeChunk = 'single';
config.optimization.moduleIds = 'named';

if (!config.performance) {
    config.performance = {};
}

config.performance.hints = false;

config.output.filename = '[name].js';

module.exports = config;

