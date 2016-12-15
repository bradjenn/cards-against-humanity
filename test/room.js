const _ = require('lodash');
let Room = require('../cah-server/room.js');
let chai = require('chai');

chai.should();

describe('Room', () => {
  let room;

  beforeEach(() => {
    room = new Room('test');
  });

  describe('#_playerCount', () => {
    beforeEach(() => {
      room.addPlayer({id: 'test', username: 'billson'});
      room.addPlayer({id: 'test2', username: 'james'});
    });

    it('returns the number of players in the room', () => {
      room._playerCount.should.equal(2);
    });
  });

  describe('#_currentGame', () => {
    let firstGame;
    let secondGame;

    beforeEach(() => {
      firstGame = room.newGame();
      secondGame = room.newGame();
    });

    it('returns the current game', () => {
      (room._currentGame).should.equal(secondGame);
    });
  });

  describe('#_whiteCardsUsed', () => {
    let firstGame;
    let secondGame;

    beforeEach(() => {
      firstGame = room.newGame();
      secondGame = room.newGame();
    });

    it('returns the current game', () => {
      (room._currentGame).should.equal(secondGame);
    });
  });

  describe('#newGame', () => {
    beforeEach(() => {
      room.newGame();
    });

    it('creates a new game', () => {
      room.games.length.should.equal(1);
    });
  });

  describe('#newMessage', () => {
    beforeEach(() => {
      room.newMessage({
        username: 'johnny',
        text: 'hi there',
        type: 'chat'
      });
    });

    it('adds a new message to the room', () => {
      room.messages.length.should.equal(1);
    });
  });

  describe('#getGameById', () => {
    let firstGame;
    let secondGame;

    beforeEach(() => {
      firstGame = room.newGame();
      secondGame = room.newGame();
    });

    it('returns the correct game', () => {
      room.getGameById(firstGame.id).should.equal(firstGame);
    });
  });


  describe('#addPlayer', () => {
    beforeEach(() => {
      room.addPlayer({id: 'test', username: 'billson'});
    });

    it('adds the player to the room', () => {
      Object.keys(room.players).length.should.equal(1);
    });

    it('only adds the player once', () => {
      room.addPlayer({id: 'test', username: 'billson'});
      Object.keys(room.players).length.should.equal(1);
    });
  });
});
