const _ = require('lodash');
const data = require('../data.json');
const Player = require('../cah-server/player.js');
const Round = require('../cah-server/round.js');
const chai = require('chai');

chai.should();

describe('Round', () => {
  let round;
  let players = {};
  let playerCount = 0;
  let cardCount = 0;
  let whiteCardsUsed = [];
  let blackCardsUsed = [];

  while (playerCount < 100) {
    const id = _.uniqueId('player');
    players[id] = new Player(id, `player-${ id }`);
    whiteCardsUsed.push(_.random(0, data.whiteCards.length))
    blackCardsUsed.push(_.random(0, data.blackCards.length))

    playerCount++;
  }

  blackCardsUsed = _.uniq(blackCardsUsed);
  whiteCardsUsed = _.uniq(whiteCardsUsed);

  describe('allocating white cards', () => {
    let playerCards;

    beforeEach(() => {
      round = new Round('1', players, whiteCardsUsed);
      playerCards = _.uniq(_.flatMap(round.players, (player => player.cardIndexes)));
    });

    it('allocates unique white cards to all players', () => {
      const numberOfPlayers = _.keys(players).length;
      playerCards.length.should.equal(numberOfPlayers * 10);
    });

    it('doesnt use previously used white cards', () => {
      playerCards.forEach((card) => {
        whiteCardsUsed.includes(card).should.be.false;
      });
    });
  });

  describe('allocating black cards', () => {
    beforeEach(() => {
      round = new Round('1', players, whiteCardsUsed, blackCardsUsed);
    });

    it('allocates a unique black card each time', () => {
      round.blackCardsUsed.length.should.equal(blackCardsUsed.length + 1);
    });
  });

  describe('assigning a judge', () => {
    describe('when nobody has been a judge', () => {
      beforeEach(() => {
        round = new Round('1', players, whiteCardsUsed, blackCardsUsed, []);
      });

      it('assigns the first player to be judge', () => {
        round.judgeId.should.equal('player1');
      });
    });

    describe('when a few people have been judge', () => {
      beforeEach(() => {
        round = new Round('1', players, whiteCardsUsed, blackCardsUsed, 'player3');
      });

      it('assigns the first player to be judge', () => {
        round.judgeId.should.equal('player4');
      });
    });

    describe('when everyone has been a judge', () => {
      beforeEach(() => {
        round = new Round('1', players, whiteCardsUsed, blackCardsUsed, 'player100');
      });

      it('assigns the first player to be judge again', () => {
        round.judgeId.should.equal('player1');
      });
    });
  });

  describe('#winnerChosen', () => {
    beforeEach(() => {
      round = new Round('1', players);

      _.forEach(players, (player, playerId) => {
        let choiceCount = 0;
        let choices = [];

        while (choiceCount < round.blackCard.pick) {
          choices.push(player.cards[choiceCount].index);
          choiceCount++;
        }

        round.playerSubmitted(playerId, choices);
      });

      round.winnerChosen('player88');
    });

    it('sets the correct winner for the round', () => {
      round.winnerId.should.equal('player88');
    });

    it('removes the choices from the players stack', () => {
      _.forEach(players, (player, playerId) => {
        player.cards.length.should.equal(10 - round.blackCard.pick);
      });
    });
  });

  describe('#playerJoined', () => {
    beforeEach(() => {
      round = new Round('1', players);
      round.playerJoined(new Player('player102', 'bob'));
    });

    it('adds the player to the round', () => {
      round.playerIds.includes('player102').should.be.true;
    });

    it('allocates cards for new player', () => {
      round.players['player102'].cards.length.should.equal(10);
    });
  });

  describe('#playerSubmitted', () => {
    let player;
    let choiceCount = 0;
    let choices = [];

    beforeEach(() => {
      round = new Round('1', players);
      player = round.players['player1'];

      while (choiceCount < round.blackCard.pick) {
        choices.push(player.cards[choiceCount].index);
        choiceCount++;
      }

      round.playerSubmitted('player1', choices);
    });

    it('submits the players choices to the round', () => {
      round.chosenWhiteCards['player1'].should.equal(choices);
    });
  });
});
