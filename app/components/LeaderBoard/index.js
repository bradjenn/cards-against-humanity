import React from 'react';
import styles from './style.scss';

const LeaderBoard = React.createClass({
  renderRow({ playerId, score }, i) {
    const { room } = this.props;

    return (
      <li key={ i }>
        <span className="player">
          { room.players[playerId].username }
        </span>
        { score }
      </li>
    );
  },

  getResults() {
    const { room } = this.props;
    const scores = _.map(room.players, (player, playerId) => {
      return {
        playerId: playerId,
        score: room.rounds.filter(r => r.winnerId === playerId).length
      };
    });

    return _.orderBy(scores, ['score'], ['desc']).map(this.renderRow);
  },

  render() {
    return (
      <div className={ styles.leaderboard }>
        <h4>Leaderboard</h4>
        <ul>{ this.getResults() }</ul>
      </div>
    );
  }
});

export default LeaderBoard;
