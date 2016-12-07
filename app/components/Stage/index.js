import React from 'react';
import classnames from 'classnames';
import _ from 'lodash';
import style from './styles.scss'

import { Card } from '../';

const Stage = React.createClass({
  getInitialState() {
    return {
      selectedCards: [],
      readyToSubmit: false
    };
  },

  startGame() {
    this.props.socket.emit('start-game');
  },

  selectCard(cardIndex) {
    const currentRound = _.last(this.props.room.rounds);
    if (!currentRound) { return; }

    const blackCard = this.getBlackCard(currentRound);
    let selectedCards = this.state.selectedCards;
    const availablePosition = selectedCards.indexOf(null);

    if (selectedCards.includes(cardIndex)) {
      const i = selectedCards.indexOf(cardIndex);
      selectedCards[i] = null;
    } else if (availablePosition > -1) {
      selectedCards[availablePosition] = cardIndex;
    } else if (selectedCards.length === blackCard.pick) {
      return;
    } else {
      selectedCards.push(cardIndex);
    }

    this.setState({
      selectedCards,
      readyToSubmit: selectedCards.length === blackCard.pick
    });
  },

  renderWhiteCard(card, i) {
    return (
      <Card
        key={ i }
        colour="white"
        card={ card }
        isSelected={ this.state.selectedCards.includes(card.index) }
        onClick={ this.selectCard } />
    );
  },

  getBlackCard(round) {
    return this.props.data.blackCards[round.blackCardIndex];
  },

  renderSubmitButton(round) {
    if (!this.state.readyToSubmit || round.playersChosenWhiteCards[this.props.user.id]) {
      return null;
    }

    return <button type="button" onClick={ this.submitChoices.bind(null, round.id) }>Submit Choices</button>;
  },

  renderNewRoundButton(round) {
    if (!round.winnerId) {
      return null;
    }

    return <button type="button" onClick={ this.newRound }>Next Round</button>;
  },

  newRound() {
    this.props.socket.emit('next-round');
  },

  chooseWinner(playerId, round) {
    this.props.socket.emit('winner-chosen', { winnerId: playerId, roundId: round.id });
  },

  submitChoices(roundId) {
    this.props.socket.emit('player-submission', {
      playerId: this.props.user.id,
      choices: this.state.selectedCards
    });

    this.setState({ selectedCards: [], readyToSubmit: false });
  },

  renderSubmissions(currentRound) {
    const { room, data, user } = this.props;
    if (_.isEmpty(currentRound.playersChosenWhiteCards)) {
      return null;
    }

    const submissions = currentRound.playerIds.map((playerId, index) => {
      if (playerId !== currentRound.judgeId && currentRound.playersChosenWhiteCards[playerId]) {
        const player = room.players[playerId];
        const playerSubmissions = currentRound.playersChosenWhiteCards[playerId].map((cardIndex, i) => {

          return (
            <div key={ i } className="card white">
              <div className="inner">
                <p dangerouslySetInnerHTML={{__html: data.whiteCards[cardIndex] }} />
              </div>
            </div>
          );
        });

        let chooseWinnerButton = null;
        if (user.id === currentRound.judgeId && _.keys(currentRound.playersChosenWhiteCards).length === (currentRound.playerIds.length - 1) && currentRound.winnerId === null) {
          chooseWinnerButton = <button type="text" onClick={ this.chooseWinner.bind(null, playerId, currentRound) }>Choose Winner</button>;
        };

        return (
          <div className="submission" key={ index }>
            <p>{ player.username }</p>
            <div className="chosen-cards">
              { playerSubmissions }
            </div>

            { chooseWinnerButton }
          </div>
        );
      }
    });

    return submissions;
  },

  renderStageContent() {
    const { room, user } = this.props;
    const currentRound = _.last(room.rounds);

    if (currentRound.judgeId === user.id) {
      return (
        <div className="judge-stage">
          You are the judge! Wait for submissions
          { this.renderSubmissions(currentRound) }
        </div>
      );
    }

    if (currentRound.playersChosenWhiteCards[user.id]) {
      return (
        <div className="judge-stage">
          { this.renderSubmissions(currentRound) }
        </div>
      );
    }

    return user.cards.map(this.renderWhiteCard);
  },

  getPickAmount(round) {
    const { user } = this.props;
    const blackCard = this.getBlackCard(round);
    const actualSelectedCards = this.state.selectedCards.filter((c) => _.isNumber(c)).length;
    return round.playersChosenWhiteCards[user.id] ? 0 : blackCard.pick - actualSelectedCards;
  },

  renderScoreBoard(room) {
    const counts = {};
    const winners = room.rounds.map(r => r.winnerId).filter(w => w !== null);
    winners.forEach((winner) => { counts[winner] = (counts[winner] || 0) + 1 });

    const results = _.map(room.players, (player, playerId) => {
      return (
        <li key={ playerId }>{ player.username }: { counts[playerId] || 0 }</li>
      );
    });

    return (
      <div>
        <p>Leader board</p>
        <ul>{ results }</ul>
      </div>
    );
  },

  renderContent() {
    const { room, data, user } = this.props;
    const currentRound = _.last(room.rounds);
    const playerCount = _.keys(room.players).length;

    if (playerCount < 3) {
      return <p className={ style.overlay }>Waiting for more players to join</p>;
    }

    if (playerCount > 2 && !currentRound) {
      return (
        <div className={ style.overlay }>
          <button type="button" onClick={ this.startGame }>Start the fucking game!</button>
        </div>
      );
    }

    return (
      <div className="stage-content">
        <div className="header">
          <p className="round">Round { room.rounds.length }</p>
          <p>{ user.username }</p>
        </div>

        <div className="body">
          <div className="col-left">
            <Card
              colour="black"
              card={ this.getBlackCard(currentRound) }
              pickAmount={ this.getPickAmount(currentRound) } />

            { this.renderScoreBoard(room) }
            { this.renderSubmitButton(currentRound) }
            { this.renderNewRoundButton(currentRound) }
          </div>

          <div className="col-right">
            { this.renderStageContent() }
          </div>
        </div>
      </div>
    );
  },

  render() {
    return (
      <div className="stage">
        { this.renderContent() }
      </div>
    );
  }
});

export default Stage;
