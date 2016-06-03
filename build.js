'use strict';

/* eslint-env node */
/* eslint no-console: "off" */

const process = require('process');
const webpack = require('webpack');

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

if (process.argv.length > 2) {
    if (process.argv[2] === 'watch') {
        webpack(webpackConfig).watch({}, webpackBuildFinished);
        return;
    } else if (process.argv[2] === 'live') {
        const webpackDevServer = require('webpack-dev-server');
        webpackConfig.entry.app.unshift('webpack-dev-server/client?http://localhost:8080/', 'webpack/hot/dev-server');
        webpackConfig.plugins.unshift(new webpack.HotModuleReplacementPlugin());
        const server = new webpackDevServer(webpack(webpackConfig), { hot: true, compress: true, stats: { colors: true, timings: true, cached: false }});
        server.listen(8080, "localhost");
        return;
    }
}

webpack(webpackConfig).run(webpackBuildFinished);

