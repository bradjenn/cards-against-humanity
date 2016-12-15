const CahServer = require('./cah-server');
const isProduction = process.env.NODE_ENV === 'production';
const _ = require('lodash');
const port = process.env.PORT || 3000;
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app); // eslint-disable-line new-cap
const io = require('socket.io')(server);
const { cleanString, urlifyText } = require('./utils');
const data = require('./data.json');
const rooms = {};

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname + '/public/index.html'));
});

app.get('/:id', (req,res) => {
  res.sendFile(path.resolve(__dirname + '/public/room.html'));
});

app.use(express.static('public'));

const cahServer = new CahServer(io);
io.on('connection', (socket) => {
  cahServer.init(socket);
});

if (!isProduction) {
  const webpack = require('webpack');
  const WebpackDevServer = require('webpack-dev-server');
  const webpackConfig = require('./webpack.config.js');

  new WebpackDevServer(webpack(webpackConfig), {
    hot: false,
    noInfo: true,
    quiet: false,
    publicPath: '/build/',
    proxy: { '*': 'http://localhost:3000' },
    stats: { colors: true },
  }).listen(8080, 'localhost', err => {
    if (err) console.log(err);
    console.log('Webpack Dev Server listening at 8080');
  });
}
