/* eslint-env node */

const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    devtool: 'cheap-module-source-map',
    context: path.resolve(__dirname),
    entry: {
        app: './src/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].min.js'
    },
    resolve: {
        root: path.resolve(__dirname, 'src'),
        extensions: ['', '.js'],
        modulesDirectories: ['node_modules'],
    },
    node: {
        fs: 'empty'
    },
    eslint: {
        configFile: path.join(__dirname, '.eslintrc.json')
    },
    postcss: () => [autoprefixer],
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                include: [ path.resolve(__dirname, 'src') ],
                loader: 'eslint'
            }
        ],
        loaders: [
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style', 'css!postcss')
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('style', 'css!postcss!less')
            },
            {
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'node_modules/jsmediatags') // need to transform for minification
                ],
                loader: 'babel'
            },
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        }),
        new ExtractTextPlugin('style.css', {allChunks: true})
    ]
};
