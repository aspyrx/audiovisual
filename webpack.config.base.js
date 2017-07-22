'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ctxDir = path.resolve(__dirname);
const srcDir = path.resolve(ctxDir, 'src');
const outDir = path.resolve(ctxDir, 'dist');
const publicPath = '/';

const babelConfig = {
    presets: [
        ['env', {
            targets: {
                browsers: ['defaults']
            },
            modules: false
        }],
        'react'
    ],
    plugins: [
        'react-hot-loader/babel'
    ]
};

module.exports = {
    devtool: 'cheap-module-source-map',
    context: ctxDir,
    entry: {
        main: [srcDir],
        lib: [
            'babel-polyfill',
            'react', 'react-dom',
            'react-router', 'react-router-dom'
        ]
    },
    output: {
        path: outDir,
        publicPath,
        filename: '[name].[chunkhash].js'
    },
    resolve: {
        alias: {
            '~': srcDir,
            'jsmediatags$': 'jsmediatags/dist/jsmediatags.min.js'
        }
    },
    module: {
        rules: [{
            test: /\.css$/,
            include: [/node_modules/],
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: { importLoaders: 1 }
            }, {
                loader: 'postcss-loader'
            }]
        }, {
            test: /\.less$/,
            include: [/node_modules/],
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: { importLoaders: 2 }
            }, {
                loader: 'postcss-loader'
            }, {
                loader: 'less-loader'
            }]
        }, {
            test: /\.css$/,
            include: [srcDir],
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: {
                    modules: true,
                    localIdentName: '[local]-[hash:base64:5]',
                    importLoaders: 1
                }
            }, {
                loader: 'postcss-loader'
            }]
        }, {
            test: /\.less$/,
            include: [srcDir],
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: {
                    modules: true,
                    localIdentName: '[local]-[hash:base64:5]',
                    importLoaders: 2
                }
            }, {
                loader: 'postcss-loader'
            }, {
                loader: 'less-loader'
            }]
        }, {
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader',
                options: babelConfig
            }]
        }]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: ['lib', 'manifest']
        }),
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        })
    ]
};
