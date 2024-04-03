'use strict';

const config = require('./webpack.config.base.js');

config.mode = 'production';
config.output.clean = true;

module.exports = config;

