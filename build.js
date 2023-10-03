#!/usr/bin/env node

'use strict';

const path = require('path');
const webpack = require('webpack');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const ProgressBar = require('progress');

const action = process.argv[2];
const port = process.argv[3] || 10102;

const webpackCompiler = webpack(function getWebpackConfig(act) {
    switch (act) {
        case 'production':
            return require('./webpack.config.production.js');
        case 'live':
            return require('./webpack.config.live.js');
        default:
            throw new Error(`Unknown action "${act}"`);
    }
}(action));

/**
 * Callback for when the webpack build completes.
 *
 * @param {Object?} err - The build error, if any.
 * @param {Object?} stats - The build statistics, upon success.
 */
function webpackBuildFinished(err, stats) {
    if (err) {
        console.log('\n\n===== WEBPACK BUILD FAILED =====');
        throw err;
    }

    console.log('\n\n===== WEBPACK BUILD FINISHED =====');
    console.log(stats.toString({ colors: true, timings: true, cached: false }));
}

const webpackProgress = new ProgressBar(
    '[:bar] :percent eta :etas  :msg', {
        total: 100, complete: '=', incomplete: ' ', width: 10
    }
);

new ProgressPlugin(function(percent, msg) {
    webpackProgress.update(percent, { msg });
}).apply(webpackCompiler);

switch (action) {
    case 'live': {
        const webpackDevServer = require('webpack-dev-server');
        const server = new webpackDevServer({
            hot: true,
            historyApiFallback: true,
            static: [{
                directory: path.join(__dirname, 'dist')
            }, {
                directory: path.join(__dirname, 'public')
            }],
            devMiddleware: {
                stats: { colors: true, timings: true, cached: false }
            }
        }, webpackCompiler);
        server.listen(port);
        return;
    }
    default:
        webpackCompiler.run(webpackBuildFinished);
}

