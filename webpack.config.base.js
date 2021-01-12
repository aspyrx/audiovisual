'use strict';

const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const ctxDir = path.resolve(__dirname);
const srcDir = path.resolve(ctxDir, 'src');
const outDir = path.resolve(ctxDir, 'dist');
const publicPath = '/';

module.exports = {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    context: ctxDir,
    entry: {
        main: ['normalize.css', srcDir],
        react: [
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
                loader: MiniCssExtractPlugin.loader
            }, {
                loader: 'css-loader'
            }]
        }, {
            test: /\.less$/,
            include: [srcDir],
            use: [{
                loader: MiniCssExtractPlugin.loader
            }, {
                loader: 'css-loader',
                options: {
                    sourceMap: true,
                    modules: {
                        mode: 'local',
                        localIdentName: '[local]-[hash:base64:5]',
                        context: ctxDir
                    },
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
            include: [srcDir],
            use: [{
                loader: 'babel-loader'
            }]
        }]
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    plugins: [
        new ESLintPlugin(),
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            cache: false,
            hash: true
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[chunkhash].css'
        })
    ]
};
