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
      PATHS.app.index
    ],
    room: [
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
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'postcss', 'sass'],
        exclude: /node_modules/,
      },
    ],
  },

  postcss: () => {
    return [autoprefixer({ browsers: ['last 2 versions'] })];
  },

  plugins: [
    new webpack.NoErrorsPlugin(),
  ],
};

module.exports = config;
