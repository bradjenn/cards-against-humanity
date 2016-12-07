import React from 'react';
import { Card, ChooseWinnerButton } from '../';

import styles from './style.scss';

const PlayerSubmissions = React.createClass({
  renderPlayerSubmission(cardIndex, index) {
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

  renderSubmission(playerId, index) {
    const { round, user, room } = this.props;
    if (!round.playersChosenWhiteCards[playerId]) { return null; }
    const player = room.players[playerId];

    return (
      <div className="submission" key={ index }>
        <div className="chosen-cards">
          { round.playersChosenWhiteCards[playerId].map(this.renderPlayerSubmission) }
        </div>
        <ChooseWinnerButton
          { ...this.props }
          playerId={ playerId }
          onClick={ this.chooseWinner }
          round={ round } />
      </div>
    );
  },

  chooseWinner(playerId) {
    const { round } = this.props;
    this.props.socket.emit('winner-chosen', { winnerId: playerId, roundId: round.id });
  },

  render() {
    return (
      <div className={ styles.playerSubmissions }>
        { this.props.round.playerIds.map(this.renderSubmission) }
      </div>
    );
  }
});

export default PlayerSubmissions;
