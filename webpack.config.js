const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: ['./src/app/main.js', './src/app/main.scss'],
    devtool: 'source-map',
    output: {
        path: path.join(__dirname, "./app"),
        filename: '[name].bundle.js',
        
        libraryTarget: "var",
        library: "VSL"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.scss$/,
                loaders: ExtractTextPlugin.extract({
                    fallback: ["style-loader"],
                    use: ["css-loader", "sass-loader"]
                })
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: `${__dirname}/src/app/index.html`,
            filename: 'index.html',
            inject: 'body',
        }),
        new ExtractTextPlugin("[name].css"),
        new webpack.DefinePlugin({
            'VERSION': JSON.stringify(require('./package.json').version)
        })
    ]
};
