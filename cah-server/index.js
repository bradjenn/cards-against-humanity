const _ = require('lodash');
const Room = require('./room.js');
const Player = require('./player.js');
const { cleanString, urlifyText } = require('../utils');

class CahServer {
  constructor(io) {
    this.io = io;
    this.rooms = {};
  }

  init(socket) {
    this.socket = socket;
    socket.on('join', this.userJoined.bind(this));
    socket.on('disconnect', this.userLeft.bind(this));
    socket.on('adduser', this.addPlayer.bind(this));
    socket.on('sendchat', this.sendChat.bind(this));
    socket.on('start-game', this.startGame.bind(this));
    socket.on('player-submission', this.playerSubmitted.bind(this));
    socket.on('winner-chosen', this.winnerChosen.bind(this));
    socket.on('next-round', this.nextRound.bind(this));
  }

  userJoined(roomName) {
    this.rooms[roomName] = this.rooms[roomName] || new Room(roomName);
    this.socket.room = this.rooms[roomName];
    this.socket.join(roomName);
    this.updateRoom();
  }

  userLeft() {
    const { room, player } = this.socket;
    if (room && player) {
      room.playerLeft(player.id);

      this.updateRoom();
    }
  }

  addPlayer(player) {
    let { id, username } = player;

    if (username === null || username === "") {
      username = `Guest${ id }`;
    } else {
      username = cleanString(username);
    }

    const newPlayer = new Player(id, username);

    this.socket.player = newPlayer;
    try {
      this.socket.room.addPlayer(newPlayer);
    }

    catch(error) {
      console.log(error);
    }

    this.socket.room.newMessage({
      username: 'Server',
      text: `${ username } has joined`,
      type: 'server'
    });

    if (this.socket.room._currentGame) {
      this.socket.room._currentGame.playerJoined(player);
    }

    this.updateRoom();
  }

  sendChat(data) {
    this.socket.room.newMessage({
      username: this.socket.player.username,
      text: urlifyText(cleanString(data)),
      type: 'chat'
    });

    this.updateRoom();
  }

  startGame() {
    this.socket.room.newGame();
    this.displayNextJudge();
    this.updateRoom();
  }

  displayNextJudge() {
    const { room } = this.socket;
    room.newMessage({
      username: 'Server',
      text: `Round ${ room._currentGame.rounds.length } - ${ room._currentJudge.username } is the judge`,
      type: 'server'
    });

  }

  nextRound(gameId) {
    const { room } = this.socket;
    const game = room.getGameById(gameId);
    game.newRound(room.players);
    this.displayNextJudge();

    this.updateRoom();
  }

  playerSubmitted(gameId, roundId, playerId, choices) {
    const game = this.socket.room.getGameById(gameId);
    const round = game.getRoundById(roundId);
    round.playerSubmitted(playerId, choices);

    this.updateRoom();
  }

  winnerChosen(playerId, gameId, roundId) {
    const game = this.socket.room.getGameById(gameId);
    const round = game.getRoundById(roundId);
    const roundIndex = _.findIndex(game.rounds, { id: roundId });
    round.winnerChosen(playerId);

    this.socket.room.newMessage({
      username: 'Server',
      text: `Round ${ roundIndex + 1 } - ${ round.players[playerId].username } is the winner`,
      type: 'server'
    });

    this.updateRoom();
  }

  updateRoom() {
    const { room } = this.socket;
    const update = {
      name: room.name,
      messages: room.messages,
      games: room.games,
      players: room.players,
      playerCount: room._playerCount,
      whiteCardsUsed: room._whiteCardsUsed,
      currentGame: room._currentGame,
      currentRound: room._currentGame ? room._currentGame._currentRound : null
    };

    this.io.to(room.name).emit('updateroom', update);
  }
}

module.exports = CahServer;
