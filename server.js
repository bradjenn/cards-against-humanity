const isProduction = process.env.NODE_ENV === 'production';
const _ = require('lodash');
const port = process.env.PORT || 3000;
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app); // eslint-disable-line new-cap
const io = require('socket.io')(server);
const { cleanString } = require('./utils');
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


console.log(process.env.NODE_ENV);


const userJoined = (socket, room) => {
  if (!(room in rooms)) {
    rooms[room] = {
      players: {},
      messages: [],
      rounds: [],
      blackCardsUsed: [],
      whiteCardsUsed: [],
      previousJudges: []
    }
  };

  socket.room = room;
  socket.join(room);
  io.to(socket.room).emit('updateroom', rooms[room]);
}

const userLeft = (socket) => {
  const room = rooms[socket.room];
  if (socket.room in rooms) {
    delete room.players[socket.username];

    if (!Object.keys(room.players).length) {
      console.log('DELETING ROOM: ' + socket.room);
      delete rooms[socket.room];
    }

    if (socket.user) {
      room.messages.push({
        username: 'Server',
        text: `${ socket.user.username } has left`,
        type: 'server'
      });

      io.to(socket.room).emit('updateroom', room);
    }
  }
}

const addUser = (socket, user) => {
  const room = rooms[socket.room];

  if (user.username === null || user.username === "") {
    user.username = `Guest${ uniqId }`;
  } else {
    user.username = cleanString(user.username);
  }

  socket.user = user;

  if (!room.players[user.id]) {
    room.players[user.id] = {
      id: user.id,
      username: user.username,
      isConnected: true,
      cards: []
    };
  }

  room.messages.push({
    username: 'Server',
    text: `${ user.username } has joined`,
    type: 'server'
  });

  io.to(socket.room).emit('updateroom', room);
}

const sendChat = (socket, data) => {
  const room = rooms[socket.room];

  room.messages.push({
    username: socket.user.username,
    text: cleanString(data),
    type: 'chat'
  });

  io.to(socket.room).emit('updateroom', room);
}

const newRound = (socket) => {
  const room = rooms[socket.room];
  const blackCards = data.blackCards;
  const blackCardIndex = Math.floor(Math.random()*blackCards.length);
  room.blackCardsUsed.push(blackCardIndex);

  const round = {
    id: _.uniqueId(),
    blackCardIndex: blackCardIndex,
    judgeId: null,
    winnerId: null,
    playerIds: _.map(room.players, 'id'),
    playersChosenWhiteCards: {}
  };

  assignJudge(room, round);
  assignPlayerCards(room, round);
  room.rounds.push(round);

  room.messages.push({
    username: 'Server',
    text: `Round ${ room.rounds.length } - ${ room.players[round.judgeId].username } is the judge`,
    type: 'server'
  });

  io.to(socket.room).emit('updateroom', room);
}

const assignJudge = (room, round) => {
  const players = room.players;
  const keys = Object.keys(players);
  const judge = players[keys[ _.random(0, keys.length - 1) ]];

  if (room.previousJudges.length === keys.length) {
    room.previousJudges = [];
    room.previousJudges.push(judge.id);
    round.judgeId = judge.id;
  } else if (room.previousJudges.includes(judge.id)) {
    assignJudge(room, round);
    return;
  } else {
    room.previousJudges.push(judge.id);
    round.judgeId = judge.id;
  }
}

const getWhiteCard = (whiteCardsUsed) => {
  const whiteCards = data.whiteCards;
  const index = Math.floor(Math.random()*whiteCards.length);

  if (whiteCardsUsed.includes(index)) {
    return getWhiteCard(whiteCardsUsed);
  }

  return index;
}

const assignPlayerCards = (room, round) => {
  const whiteCards = data.whiteCards;

  _.forEach(room.players, (player, playerId) => {
    const playerCardIndexes = player.cards.map(c => c.index);

    room.rounds.forEach((round) => {
      if (round.playersChosenWhiteCards[playerId]) {
        round.playersChosenWhiteCards[playerId].forEach((cardIndex) => {
          const index = playerCardIndexes.indexOf(cardIndex);

          if (index !== -1) {
            room.players[playerId].cards.splice(index, 1);
          }
        });
      }
    });


    while (player.cards.length < 10) {
      const cardIndex = getWhiteCard(room.whiteCardsUsed);
      room.whiteCardsUsed.push(cardIndex);
      room.players[playerId].cards.push({
        index: cardIndex,
        text: whiteCards[cardIndex]
      });
    }
  });
}

const winnerChosen = (socket, { winnerId, roundId }) => {
  const room = rooms[socket.room];
  const roundIndex = room.rounds.indexOf(_.last(room.rounds));
  room.rounds[roundIndex].winnerId = winnerId;
  // assignPlayerCards(room, room.rounds[roundIndex]);

  room.messages.push({
    username: 'Server',
    text: `Round ${ room.rounds.length } - ${ room.players[winnerId].username } is the winner`,
    type: 'server'
  });

  io.to(socket.room).emit('updateroom', room);
};

const playerSubmitted = (socket, { playerId, choices }) => {
  const room = rooms[socket.room];
  const roundIndex = room.rounds.indexOf(_.last(room.rounds));
  room.rounds[roundIndex].playersChosenWhiteCards[playerId] = choices;

  io.to(socket.room).emit('updateroom', room);
}


io.on('connection', (socket) => {
  socket.on('join', userJoined.bind(null, socket));
  socket.on('disconnect', userLeft.bind(null, socket));
  socket.on('adduser', addUser.bind(null, socket));
  socket.on('sendchat', sendChat.bind(null, socket));
  socket.on('start-game', newRound.bind(null, socket));
  socket.on('winner-chosen', winnerChosen.bind(null, socket));
  socket.on('next-round', newRound.bind(null, socket));
  socket.on('player-submission', playerSubmitted.bind(null, socket));
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
