import React from 'react';
import styles from './style.scss';

const StageHeader = React.createClass({
  renderJudgeText(round, user) {
    if (round.judgeId !== user.id) {
      return null;
    }

    return <p className="judge-text">You are the czar</p>;
  },

  render() {
    const { room, round, user } = this.props;

    return (
      <div className="header">
        <p className="round">Round { room.rounds.length }</p>
        { this.renderJudgeText(round, user) }
        <p className="player">{ user.username }</p>
      </div>
    );
  }
});

export default StageHeader;
