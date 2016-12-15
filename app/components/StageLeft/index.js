import React from 'react';
import { Card, LeaderBoard } from '../';

const StageLeft = React.createClass({
  submitChoices() {
    this.props.onSubmitChoices(this.props.currentRound);
  },

  renderSubmitButton() {
    const { readyToSubmit, user, currentRound } = this.props;

    if (!readyToSubmit || currentRound.chosenWhiteCards[user.id]) {
      return null;
    }

    return (
      <button type="button" onClick={ this.submitChoices }>
        Submit Choices
      </button>
    );
  },

  getPickAmount(round) {
    const { user, selectedCards, currentRound: { chosenWhiteCards, blackCard } } = this.props;
    const actualSelectedCards = selectedCards.filter((c) => _.isNumber(c)).length;
    return chosenWhiteCards[user.id] ? 0 : blackCard.pick - actualSelectedCards;
  },

  render() {
    const { currentGame, currentRound, players } = this.props;

    return (
      <div className="col-left">
        <Card
          colour="black"
          card={ currentRound.blackCard }
          pickAmount={ this.getPickAmount(currentRound) } />

        { this.renderSubmitButton() }

        <LeaderBoard players={ players } game={ currentGame } />
      </div>
    );
  }
});

export default StageLeft;
