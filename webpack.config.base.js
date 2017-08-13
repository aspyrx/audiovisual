'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ctxDir = path.resolve(__dirname);
const srcDir = path.resolve(ctxDir, 'src');
const outDir = path.resolve(ctxDir, 'dist');
const publicPath = '/';

module.exports = {
    devtool: 'cheap-module-source-map',
    context: ctxDir,
    entry: {
        main: ['normalize.css', srcDir],
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
            'src': srcDir,
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
                options: {
                    sourceMap: true,
                    importLoaders: 1
                }
            }, {
                loader: 'postcss-loader',
                options: {
                    sourceMap: true
                }
            }]
        }, {
            test: /\.less$/,
            include: [/node_modules/],
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: {
                    sourceMap: true,
                    importLoaders: 2
                }
            }, {
                loader: 'postcss-loader',
                options: {
                    sourceMap: true
                }
            }, {
                loader: 'less-loader',
                options: {
                    sourceMap: true
                }
            }]
        }, {
            test: /\.css$/,
            include: [srcDir],
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: {
                    sourceMap: true,
                    modules: true,
                    localIdentName: '[local]-[hash:base64:5]',
                    importLoaders: 1
                }
            }, {
                loader: 'postcss-loader',
                options: {
                    sourceMap: true
                }
            }]
        }, {
            test: /\.less$/,
            include: [srcDir],
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: {
                    sourceMap: true,
                    modules: true,
                    localIdentName: '[local]-[hash:base64:5]',
                    importLoaders: 2
                }
            }, {
                loader: 'postcss-loader',
                options: {
                    sourceMap: true
                }
            }, {
                loader: 'less-loader',
                options: {
                    sourceMap: true
                }
            }]
        }, {
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader'
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
