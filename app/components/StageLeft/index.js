import React from 'react';
import { Card, LeaderBoard } from '../';

const StageLeft = React.createClass({
  submitChoices() {
    this.props.onSubmitChoices(this.props.round.id);
  },

  renderSubmitButton(round) {
    const { readyToSubmit, user } = this.props;

    if (!readyToSubmit || round.playersChosenWhiteCards[user.id]) {
      return null;
    }

    return (
      <button type="button" onClick={ this.submitChoices }>
        Submit Choices
      </button>
    );
  },

  getPickAmount(round) {
    const { user, blackCard, selectedCards } = this.props;
    const actualSelectedCards = selectedCards.filter((c) => _.isNumber(c)).length;
    return round.playersChosenWhiteCards[user.id] ? 0 : blackCard.pick - actualSelectedCards;
  },

  render() {
    const { room, round, blackCard } = this.props;

    return (
      <div className="col-left">
        <Card
          colour="black"
          card={ blackCard }
          pickAmount={ this.getPickAmount(round) } />

        { this.renderSubmitButton(round) }

        <LeaderBoard room={ room } />
      </div>
    );
  }
});

export default StageLeft;
