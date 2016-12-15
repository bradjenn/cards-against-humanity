import React from 'react';
import classnames from 'classnames';
import _ from 'lodash';
import style from './styles.scss'

import { Card, StageLeft, StageRight, StageHeader } from '../';

const Stage = React.createClass({
  getInitialState() {
    return {
      selectedCards: [],
      readyToSubmit: false,
      renderNextRoundButton: false
    };
  },

  startGame() {
    this.props.socket.emit('start-game');
  },

  selectCard(cardIndex) {
    const { currentRound } = this.props;
    if (!currentRound) { return; }

    const { blackCard } = currentRound;

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

  submitChoices(round) {
    this.props.socket.emit('player-submission',
      round.gameId,
      round.id,
      this.props.user.id,
      this.state.selectedCards
    );

    this.setState({ selectedCards: [], readyToSubmit: false });
  },

  newRound() {
    this.setState({ renderNextRoundButton: false });
    this.props.socket.emit('next-round', this.props.currentRound.gameId);
  },

  renderNextRoundButton(round) {
    if (round.judgeId !== this.props.user.id) { return null; }

    if (this.state.renderNextRoundButton) {
      return (
        <button type="button" onClick={ this.newRound }>
          Next Round
        </button>
      );
    }

    this.timeout = setTimeout(() => {
      this.setState({ renderNextRoundButton: true });
    }, 5000);

    return null;
  },

  renderWinningCard(cardIndex, index) {
    const { data } = this.props;
    const card = {
      index: cardIndex,
      text: data.whiteCards[cardIndex]
    };

    return (
      <Card
        key={ index }
        colour="white"
        card={ card } />
    );
  },

  renderContent() {
    clearTimeout(this.timeout);
    this.timeout = undefined;
    const { selectedCards, readyToSubmit } = this.state;
    const { currentRound, data, user, players, playerCount } = this.props;

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

    if (!_.isEmpty(currentRound) && currentRound.winnerId !== null) {
      const blackCard = currentRound.blackCard;
      return (
        <div className={ style.overlay }>
          <p>{ `${ players[currentRound.winnerId].username } is the winner!` }</p>
          <div className="winning-cards">
            <div className="blackcard">
              <Card colour="black" card={ currentRound.blackCard } />
            </div>
            <div className="whitecards">
              { currentRound.chosenWhiteCards[currentRound.winnerId].map(this.renderWinningCard) }
            </div>
          </div>
          { this.renderNextRoundButton(currentRound) }
        </div>
      );
    }

    if (_.isEmpty(currentRound.chosenWhiteCards) && currentRound.judgeId === user.id) {
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
            selectedCards={ selectedCards }
            readyToSubmit={ readyToSubmit }
            onSubmitChoices={ this.submitChoices } />

          <StageRight { ...this.props }
            selectedCards={ selectedCards }
            readyToSubmit={ readyToSubmit }
            onWhiteCardSelected={ this.selectCard } />
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
