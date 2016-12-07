import React from 'react';
import classnames from 'classnames';

const Card = React.createClass({
  onClick() {
    if (this.props.onClick) {
      this.props.onClick(this.props.card.index);
    }
  },

  renderPickAmount() {
    const { pickAmount } = this.props;
    if (!_.isNumber(pickAmount)) { return null; }

    return <span className="pick-number">Pick { pickAmount }</span>;
  },

  render() {
    const { colour, isSelected, card } = this.props;
    const classes = {
      card: true,
      white: colour === 'white',
      black: colour === 'black',
      'is-selected': isSelected
    };

    return (
      <div className={ classnames(classes) } onClick={ this.onClick }>
        <div className="inner">
          <p dangerouslySetInnerHTML={{__html: card.text }} />
          { this.renderPickAmount() }
        </div>
      </div>
    );
  }
});

export default Card;
