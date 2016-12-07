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
    const { room, user, round } = this.props;

    if (round.judgeId === user.id || round.playersChosenWhiteCards[user.id]) {
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
