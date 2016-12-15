import React from 'react';
import _ from 'lodash';
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

  renderSubmission(player, playerId, index) {
    const { currentRound, user } = this.props;
    if (!currentRound.chosenWhiteCards[player.id]) { return null; }

    // const { data, currentRound, user } = this.props;
    // if (!currentRound.chosenWhiteCards[player.id]) { return null; }
    // let pickCount = 0;
    // let blackCardText = currentRound.blackCard.text;
    //
    // currentRound.chosenWhiteCards[playerId].forEach((choice) => {
    //   const whiteCard = data.whiteCards[choice];
    //   blackCardText = blackCardText.replace('<span class=\'underline\'></span>', whiteCard);
    // });
    //
    // const card = { text: blackCardText };

    return (
      <div className="submission" key={ playerId }>
        <div className="chosen-cards">
          { currentRound.chosenWhiteCards[playerId].map(this.renderPlayerSubmission) }
        </div>
        <ChooseWinnerButton
          { ...this.props }
          playerId={ playerId }
          onClick={ this.chooseWinner } />
      </div>
    );
  },

  chooseWinner(playerId) {
    const { currentGame, currentRound } = this.props;
    this.props.socket.emit('winner-chosen', playerId, currentGame.id, currentRound.id);
  },

  render() {
    return (
      <div className={ styles.playerSubmissions }>
        { _.map(this.props.currentRound.players, this.renderSubmission) }
      </div>
    );
  }
});

export default PlayerSubmissions;
