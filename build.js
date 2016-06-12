'use strict';

/* eslint-env node */
/* eslint no-console: "off" */

const process = require('process');
const webpack = require('webpack');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const ProgressBar = require('progress');

let webpackConfig;

if (process.argv.length > 2 && process.argv[2] === 'production') {
    webpackConfig = require('./webpack.config.production');
} else {
    webpackConfig = require('./webpack.config');
}

const webpackBuildFinished = (err, stats) => {
    if (err) {
        console.log("\n\n===== WEBPACK BUILD FAILED =====");
        throw err;
    } else {
        console.log("\n\n===== WEBPACK BUILD FINISHED =====");
        console.log(stats.toString({ colors: true, timings: true, cached: false }));
    }
};

const webpackCompiler = webpack(webpackConfig);
const webpackProgress = new ProgressBar(
    '[:bar] :percent eta :etas  :msg', {
        total: 100, complete: '=', incomplete: ' ', width: 10
    }
);

let webpackPrevPercent = 0;
webpackCompiler.apply(new ProgressPlugin((percent, msg) => {
    webpackProgress.tick((percent - webpackPrevPercent) * 100, { 'msg': msg });
    webpackPrevPercent = percent;
}));

if (process.argv.length > 2) {
    if (process.argv[2] === 'watch') {
        webpackCompiler.watch({}, webpackBuildFinished);
        return;
    } else if (process.argv[2] === 'live') {
        const webpackDevServer = require('webpack-dev-server');
        webpackConfig.entry.app.push('webpack-dev-server/client?http://localhost:8080/', 'webpack/hot/dev-server');
        webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
        const server = new webpackDevServer(webpackCompiler, {
            hot: true,
            compress: true,
            historyApiFallback: true,
            stats: { colors: true, timings: true, cached: false }});
        server.listen(8080, "localhost");
        return;
    }
}

webpackCompiler.run(webpackBuildFinished);

