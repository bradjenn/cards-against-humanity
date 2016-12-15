import React from 'react';
import { PlayerSubmissions, Card } from '../';

const StageRight = React.createClass({
  renderPlayerCard(card, index) {
    const { onWhiteCardSelected, selectedCards } = this.props;
    return (
      <Card
        key={ index }
        colour="white"
        card={ card }
        isSelected={ selectedCards.includes(card.index) }
        onClick={ onWhiteCardSelected } />
    );
  },

  renderContent() {
    const { user, currentRound } = this.props;

    if (currentRound.judgeId === user.id || currentRound.chosenWhiteCards[user.id]) {
      return <PlayerSubmissions { ...this.props } />;
    }

    return user.cards.map(this.renderPlayerCard);
  },

  render() {
    return (
      <div className="col-right">
        { this.renderContent() }
      </div>
    );
  }
});

export default StageRight;
