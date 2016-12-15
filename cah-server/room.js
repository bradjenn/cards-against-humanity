const _ = require('lodash');
const Game = require('./game.js');

class Room {
  constructor(name = '', players = {}, messages = [], games = []) {
    this.name = name;
    this.players = players;
    this.messages = [...messages];
    this.games = [...games];
  }

  get _whiteCardsUsed() {
    return _.flattenDeep(_.map(this.games, (game) => {
      return game.whiteCardsUsed;
    }));
  }

  get _currentGame() {
    return _.last(this.games);
  }

  get _currentJudge() {
    return this.players[this._currentGame._currentRound.judgeId];
  }

  get _playerCount() {
    return _.keys(this.players).length;
  }

  playerLeft(playerId) {
    if (this._currentGame) {
      this._currentGame.playerLeft(playerId);
    }
  }

  getGameById(id) {
    return this.games.find(g => g.id === id);
  }

  addPlayer(player) {
    if (player.id in this.players) { return player; }
    this.players[player.id] = player;

    return player;
  }

  newMessage(message) {
    this.messages.push(message);
  }

  newGame() {
    const game = new Game(this.players);
    this.games.push(game);

    return game;
  }
}

module.exports = Room;
