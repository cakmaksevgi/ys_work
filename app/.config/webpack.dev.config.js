const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

 module.exports = {
  mode: 'development',
  entry: {
     index: './index.js'
   },
  devtool: 'inline-source-map',
  module: {
    rules: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
              ['@babel/preset-env', { targets: "defaults" }]
            ]
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        exclude: '/node_modules/',
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          }, 
          {
            loader: "css-loader",
          },
          {
          loader: "postcss-loader",
          options: {
              sourceMap: true
            },
          },
          {
          loader: "sass-loader",
          options: {
              sourceMap: true
          },
          options: {
              implementation: require("sass")
          }
      }
      ]},
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
      }
    ]
  },
  devServer: {
    contentBase: path.resolve(__dirname, './'),  // New
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    }),
    new HtmlWebpackPlugin({
      title: 'Yemek Sepeti Development',
      template: 'index.html'
     }),
     new MiniCssExtractPlugin()
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  }
 }