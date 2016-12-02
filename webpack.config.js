const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');

const PATHS = {
  app: {
    index: path.resolve(__dirname, 'app', 'index.js'),
    room: path.resolve(__dirname, 'app', 'room.js')
  },
  build: path.resolve(__dirname, 'public', 'build'),
  node: path.resolve(__dirname, 'node_modules'),
};


const config = {
  devtool: 'eval',
  entry: {
    index: [
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/dev-server',
      PATHS.app.index
    ],
    room: [
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/dev-server',
      PATHS.app.room
    ]
  },

  output: {
    path: PATHS.build,
    filename: '[name].bundle.js',
    publicPath: 'http://localhost:8080/build/',
  },

  module: {
    loaders: [
      {
        test: /\.json$/,
        loaders: ['json'],
        exclude: [PATHS.node]
      },
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: [PATHS.node]
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'postcss', 'sass'],
        exclude: [PATHS.node]
      },
    ],
  },

  postcss: () => {
    return [autoprefixer({ browsers: ['last 2 versions'] })];
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ],
};

module.exports = config;
