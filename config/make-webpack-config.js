/*
 * Based on: Yet Another React Starter Kit
 * https://github.com/bradleyboy/yarsk
 */

var appTitle = 'CAH';
var fs = require('fs');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
var autoprefixer = require('autoprefixer');
var webpackEnv = require('webpack-env');

function extractForProduction(loaders) {
  return ExtractTextPlugin.extract('style', loaders.substr(loaders.indexOf('!')));
}


module.exports = function (options) {
  options.lint = fs.existsSync(__dirname + '/../.eslintrc') && options.lint !== false;

  var localIdentName;
  var nodeDir = path.resolve(__dirname, '../node_modules');
  var webpackOptions = {
    entry: './app/cards-against-humanity.js',
    debug: false,
    output: {
      path: './dist',
      publicPath: '',
      filename: 'bundle.[hash].js'
    },
    resolve: {
      root: path.resolve('./app'),
      extensions: ['', '.js', '.jsx', '.scss', '.svg', '.gif', '.png', '.jpg']
    },
    sassLoader: {
      includePaths: [
        path.join(nodeDir, 'normalize-scss', 'sass')
      ]
    },
    module: {
      preLoaders: options.lint ? [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint',
      }] : [],
      loaders: [{
        test: /\.png$/,
        loader: 'url?limit=100000&mimetype=image/png'
      }, {
        test: /\.svg$/,
        loader: 'url?limit=100000&mimetype=image/svg+xml'
      }, {
        test: /\.gif$/,
        loader: 'url?limit=100000&mimetype=image/gif'
      }, {
        test: /\.jpg$/,
        loader: 'file'
      }, {
        test: /\.html$/,
        loader: 'raw'
      }]
    },
    postcss: function () {
      return [autoprefixer({ browsers: ['last 2 versions'] })];
    }
  };


  switch(options.env) {
    case 'production':
      localIdentName = '[hash:base64]';
      webpackOptions.module.loaders.push({
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      });
      webpackOptions.module.loaders.push({
        test: /\.scss?$/,
        exclude: /node_modules/,
        loader: extractForProduction('style!css?localIdentName=' + localIdentName + '!postcss!sass')
      });
      webpackOptions.module.loaders.push({
        test: /\.css$/,
        loader: extractForProduction('style!css?localIdentName=' + localIdentName + '!postcss')
      });
      webpackOptions.plugins = [
        new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify('production')
          }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false
          }
        }),
        new ExtractTextPlugin('app.[hash].css'),
        new HtmlWebpackPlugin({
          title: appTitle,
          template: './config/template.ejs'
        }),
        webpackEnv
      ];
      break;

    case 'test':
      localIdentName = '[path]-[local]-[hash:base64:5]';
      webpackOptions.entry = {};
      webpackOptions.debug = true;
      webpackOptions.devtool = 'inline-source-map';
      webpackOptions.output = {};
      webpackOptions.module.loaders.push({
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      });
      webpackOptions.module.loaders.push({
        test: /\.scss?$/,
        exclude: /node_modules/,
        loader: 'style!css?localIdentName=' + localIdentName + '!postcss!sass'
      });
      webpackOptions.module.loaders.push({
        test: /\.css$/,
        loader: 'style!css?localIdentName=' + localIdentName + '!postcss'
      });
      webpackOptions.plugins = [
        new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify('test')
          }
        }),
        new HtmlWebpackPlugin({
          title: appTitle,
          template: './config/template.ejs'
        }),
        webpackEnv
      ];
      break;

    default:
      localIdentName = '[path]-[local]-[hash:base64:5]';
      webpackOptions.entry = [
        'webpack-dev-server/client?http://localhost:8080',
        'webpack/hot/only-dev-server',
        './app/cards-against-humanity.js'
      ];
      webpackOptions.debug = true;
      webpackOptions.devtool = 'eval';
      webpackOptions.output = {
        path: './build',
        publicPath: 'http://localhost:8080/',
        filename: 'cards-against-humanity.js'
      };
      webpackOptions.module.loaders.push({
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      });
      webpackOptions.module.loaders.push({
        test: /\.scss?$/,
        exclude: /node_modules/,
        loader: 'style!css?localIdentName=' + localIdentName + '!postcss!sass'
      });
      webpackOptions.module.loaders.push({
        test: /\.css$/,
        loader: 'style!css?localIdentName=' + localIdentName + '!postcss'
      });
      webpackOptions.plugins = [
        new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify('development')
          }
        }),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
          title: appTitle,
          template: './config/template.ejs'
        }),
        webpackEnv
      ];
      webpackOptions.devServer = {
        contentBase: './build',
        colors: true,
        progress: true,
        hot: true,
        inline: true,
        historyApiFallback: true
      };
  }

  return webpackOptions;
};
