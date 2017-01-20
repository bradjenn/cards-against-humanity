const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';

const PATHS = {
  app: {
    index: path.resolve(__dirname, 'app', 'index.js'),
    room: path.resolve(__dirname, 'app', 'room.js')
  },
  build: path.resolve(__dirname, 'public', 'build'),
  node: path.resolve(__dirname, 'node_modules'),
};


const config = {
  debug: false,
  devtool: 'source-maps',
  entry: {
    index: PATHS.app.index,
    room: PATHS.app.room
  },

  output: {
    path: PATHS.build,
    filename: '[name].bundle.js',
    publicPath: '',
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

  postcss: function () {
    return [autoprefixer({ browsers: ['last 2 versions'] })];
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(NODE_ENV)
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
  ]
};

module.exports = config;
