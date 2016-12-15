const _ = require('lodash');
let Player = require('../cah-server/player.js');
let Game = require('../cah-server/game.js');
let chai = require('chai');

chai.should();

describe('Game', () => {
  let players;
  let game;

  beforeEach(() => {
    players = {
      player1: new Player('player1', 'bobby'),
      player2: new Player('player2', 'jones')
    };

    game = new Game(players);
  });

  it('starts a new round after creation', () => {
    game.rounds.length.should.equal(1);
  });

  describe('#newRound', () => {
    let firstRound;
    let secondRound;

    beforeEach(() => {
      firstRound = game.rounds[0];

      _.forEach(firstRound.players, (player, playerId) => {
        let choiceCount = 0;
        let choices = [];

        while (choiceCount < firstRound.blackCard.pick) {
          choices.push(player.cards[choiceCount].index);
          choiceCount++;
        }

        firstRound.playerSubmitted(playerId, choices);
      });

      firstRound.winnerChosen('player1');
      secondRound = game.newRound(players);
    });

    it('creates a new round in the game', () => {
      game.rounds.length.should.equal(2);
    });

    it('assigns new cards for each player', () => {
      secondRound.whiteCardsUsed.length.should.equal(
        firstRound.whiteCardsUsed.length + (firstRound.blackCard.pick * _.keys(players).length)
      );
    });

    it('assigns a new judge', () => {
      secondRound.judgeId.should.not.equal('player1');
    });

    it('assigns a new black card', () => {
      secondRound.blackCardsUsed.length.should.equal(2);
    });
  });

  describe('#getRoundById', () => {
    let round;

    beforeEach(() => {
      round = game.newRound(players);
    });

    it('returns the correct round', () => {
      game.getRoundById(round.id).should.equal(round);
    });
  });
});
