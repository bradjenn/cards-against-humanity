import React from 'react';
import styles from './style.scss';

const StageHeader = React.createClass({
  renderJudgeText(round, user) {
    if (round && round.judgeId !== user.id) {
      return null;
    }

    return <p className="judge-text">You are the czar</p>;
  },

  render() {
    const { currentGame, currentRound, user } = this.props;

    return (
      <div className="header">
        <p className="round">Round { currentGame.rounds.length }</p>
        { this.renderJudgeText(currentRound, user) }
        <p className="player">{ user.username }</p>
      </div>
    );
  }
});

export default StageHeader;
