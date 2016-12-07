import React from 'react';
import classnames from 'classnames';
import _ from 'lodash';
import style from './styles.scss'

import { Card, StageLeft, StageRight, StageHeader } from '../';

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

    const actualSelectedCards = selectedCards.filter((c) => _.isNumber(c)).length;

    this.setState({
      selectedCards,
      readyToSubmit: actualSelectedCards === blackCard.pick
    });
  },

  getBlackCard(round) {
    return this.props.data.blackCards[round.blackCardIndex];
  },

  submitChoices(roundId) {
    this.props.socket.emit('player-submission', {
      playerId: this.props.user.id,
      choices: this.state.selectedCards
    });

    this.setState({ selectedCards: [], readyToSubmit: false });
  },

  newRound() {
    this.props.socket.emit('next-round');
  },

  renderNextRoundButton(round) {
    if (round.judgeId !== this.props.user.id) {
      return null;
    }

    return (
      <button type="button" onClick={ this.newRound }>
        Next Round
      </button>
    );
  },

  renderContent() {
    const { selectedCards, readyToSubmit } = this.state;
    const { room, data, user } = this.props;
    const currentRound = _.last(room.rounds);
    const playerCount = _.keys(room.players).length;

    if (playerCount < 3) {
      return <p className={ style.overlay }>Waiting for more players to join...</p>;
    }

    if (playerCount > 2 && !currentRound) {
      return (
        <div className={ style.overlay }>
          <button type="button" onClick={ this.startGame }>Start the fucking game!</button>
        </div>
      );
    }

    if (currentRound.winnerId !== null) {
      return (
        <div className={ style.overlay }>
          <p>{ `${ room.players[currentRound.winnerId].username } is the winner!` }</p>
          { this.renderNextRoundButton(currentRound) }
        </div>
      );
    }

    if (_.isEmpty(currentRound.playersChosenWhiteCards) &&
      currentRound.judgeId === user.id) {
      return (
        <div className={ style.overlay }>
          <p>You are the Card Czar <br /> Waiting for Submissions</p>
        </div>
      );
    }

    return (
      <div className="stage-content">
        <StageHeader { ...this.props } round={ currentRound } />

        <div className="body">
          <StageLeft { ...this.props }
            round={ currentRound }
            selectedCards={ selectedCards }
            readyToSubmit={ readyToSubmit }
            onSubmitChoices={ this.submitChoices }
            blackCard={ this.getBlackCard(currentRound) } />

          <StageRight { ...this.props }
            round={ currentRound }
            selectedCards={ selectedCards }
            readyToSubmit={ readyToSubmit }
            onWhiteCardSelected={ this.selectCard }
            blackCard={ this.getBlackCard(currentRound) } />
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
