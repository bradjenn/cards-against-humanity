const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app); // eslint-disable-line new-cap
const io = require('socket.io')(server);
const { cleanString } = require('./utils');
const rooms = {};

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get('/', function(req, res){
  res.sendFile(path.resolve(__dirname + '/public/index.html'));
});

app.get('/:id', function(req,res){
  res.sendFile(path.resolve(__dirname + '/public/room.html'));
});

app.use(express.static('public'));

const userJoined = (socket, room) => {
  if (!(room in rooms)) {
    rooms[room] = {
      usernames: {},
      messages: [],
      rounds: {}
    }
  };

  socket.room = room;
  socket.join(room);
}

const userLeft = (socket) => {
  const room = rooms[socket.room];
  if (socket.room in rooms) {
    delete room.usernames[socket.username];
  }

  if (room && socket.username) {
    room.messages.push({
      username: 'Server',
      text: `${ socket.username } has left`,
      type: 'server'
    });

    socket.broadcast.to(socket.room).emit('updatechat', room.messages);
  }

  if (!Object.keys(room.usernames).length) {
    console.log('DELETING ROOM: ' + socket.room);
    delete rooms[socket.room];
  }
}


const addUser = (socket, username) => {
  const room = rooms[socket.room];
  if (username === null || username === "") {
    username = 'Guest' + Math.floor((Math.random() * 10000000) + 1);
  } else {
    username = cleanString(username);
  }

  socket.username = username;
  room.usernames[username] = {
    cards: []
  };

  room.messages.push({
    username: 'Server',
    text: `${ socket.username } has joined`,
    type: 'server'
  });


  io.to(socket.room).emit('user joined', { username: socket.username });
  io.to(socket.room).emit('updatechat', room.messages);
}


const sendChat = (socket, data) => {
  const room = rooms[socket.room];

  room.messages.push({
    username: socket.username,
    text: cleanString(data),
    type: 'chat'
  });

  io.to(socket.room).emit('updatechat', room.messages);
}


io.on('connection', (socket) => {
  socket.on('join', userJoined.bind(null, socket));
  socket.on('disconnect', userLeft.bind(null, socket));
  socket.on('adduser', addUser.bind(null, socket));
  socket.on('sendchat', sendChat.bind(null, socket));

  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });
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
