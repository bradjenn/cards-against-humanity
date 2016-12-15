const _ = require('lodash');
const data = require('../data.json');

class Round {
  constructor(gameId, players = {}, whiteCardsUsed = [], blackCardsUsed = [], previousJudge) {
    this.gameId = gameId;
    this.id = _.uniqueId(Math.floor(Date.now() / 1000));
    this.players = players;
    this.playerIds = _.map(this.players, (p => p.id));
    this.whiteCardsUsed = [...whiteCardsUsed];
    this.blackCardsUsed = [...blackCardsUsed];
    this.previousJudge = previousJudge;


    this.chosenWhiteCards = {};
    this.winnerId = null;
    this.judgeId = null;

    this.allocateWhiteCards();
    this.allocateBlackCard();
    this.assignJudge();
  }

  get _blackCardIndex() {
    return this.blackCard.index;
  }

  playerLeft(playerId) {
    // const player = this.players[playerId];
    // if (!player && !player.cards) { return; }
    // delete this.chosenWhiteCards[playerId];
    //
    // player.cards.forEach((card) => {
    //   const cardIndex = _.findIndex(this.whiteCardsUsed, { index: card.index });
    //   this.whiteCardsUsed.splice(cardIndex, 1);
    // });
    //
    // delete this.players[playerId];
    // this.playerIds = _.map(this.players, (p => p.id));
    //
    // if (this.judgeId === playerId) {
    //   this.judgeId = null;
    //   this.assignJudge();
    // }
  }

  playerJoined(player) {
    this.players[player.id] = player;
    this.playerIds.push(player.id);
    this.allocateWhiteCards();
  }

  assignJudge() {
    if (!this.previousJudge) {
      this.judgeId = this.playerIds[0];
    } else {
      const nextJudgeIndex = this.playerIds.indexOf(this.previousJudge) + 1;
      if (this.playerIds[nextJudgeIndex]) {
        this.judgeId = this.playerIds[nextJudgeIndex];
      } else {
        this.judgeId = this.playerIds[0];
      }
    }
  }

  getWhiteCard() {
    const whiteCards = data.whiteCards;
    const index = _.random(0, whiteCards.length - 1)

    if (this.whiteCardsUsed.includes(index)) {
      return this.getWhiteCard();
    }

    return index;
  }

  allocateBlackCard() {
    const blackCards = data.blackCards;
    const index = _.random(0, blackCards.length - 1)

    if (this.blackCardsUsed.includes(index)) {
      return this.allocateBlackCard();
    }

    this.blackCardsUsed.push(index);
    this.blackCard = {
      index: index,
      text: blackCards[index].text,
      pick: blackCards[index].pick
    }
  }

  playerSubmitted(playerId, choices) {
    this.chosenWhiteCards[playerId] = choices;
  }

  winnerChosen(playerId) {
    this.winnerId = playerId;

    _.forEach(this.chosenWhiteCards, (choices, playerId) => {
      const player = this.players[playerId];
      choices.forEach((choice) => {
        const choiceIndex = _.findIndex(player.cards, { index: choice });
        player.cards.splice(choiceIndex, 1);
      });
    });
  }

  allocateWhiteCards() {
    _.forEach(this.players, this.allocateWhiteCardsForPlayer.bind(this));
  }

  allocateWhiteCardsForPlayer(player, playerId) {
    const whiteCards = data.whiteCards;
    if (!player && !player.cards) { player.cards = []; }

    while (player.cards.length < 10) {
      const cardIndex = this.getWhiteCard();
      this.whiteCardsUsed.push(cardIndex);

      const card = {
        index: cardIndex,
        text: whiteCards[cardIndex]
      }

      player.addWhiteCard(card);
    }
  }
}

module.exports = Round;
