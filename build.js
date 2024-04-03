'use strict';

const path = require('path');
const process = require('process');
const webpack = require('webpack');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const ProgressBar = require('progress');

const webpackProgress = new ProgressBar(
    '[:bar] :percent eta :etas  :msg', {
        total: 100, complete: '=', incomplete: ' ', width: 10
    }
);

const webpackConfig = (function getWebpackConfig(action) {
    switch (action) {
        case 'production':
            return require('./webpack.config.production.js');
        case 'live':
            return require('./webpack.config.live.js');
        default:
            return require('./webpack.config.js');
    }
}(process.argv[2]));

webpackConfig.plugins.push(new ProgressPlugin((percent, msg) => {
    webpackProgress.update(percent, { 'msg': msg });
}));

const webpackCompiler = webpack(webpackConfig);

const webpackBuildFinished = (err, stats) => {
    if (err) {
        console.log('\n\n===== WEBPACK BUILD FAILED =====');
        throw err;
    } else {
        console.log('\n\n===== WEBPACK BUILD FINISHED =====');
        console.log(stats.toString({
            colors: true,
            timings: true,
            cached: false
        }));
    }
};

switch (process.argv[2]) {
    case 'watch':
        webpackCompiler.watch({}, webpackBuildFinished);
        return;
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
        server.start(8080, 'localhost');
        return;
    }
    default:
        webpackCompiler.run(webpackBuildFinished);
}
