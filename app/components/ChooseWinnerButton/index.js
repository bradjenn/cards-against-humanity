import React from 'react';

const ChooseWinnerButton = React.createClass({
  onClick() {
    this.props.onClick(this.props.playerId);
  },

  render() {
    const { user, round } = this.props;
    if (user.id !== round.judgeId) { return null; }
    if (_.keys(round.playersChosenWhiteCards).length !== (round.playerIds.length - 1)) { return null; }
    if (round.winnerId !== null) { return null; }

    return <button type="text" onClick={ this.onClick }>Choose Winner</button>;
  }
});

export default ChooseWinnerButton;
