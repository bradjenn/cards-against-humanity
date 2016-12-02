import React from 'react';
import classnames from 'classnames';
import styles from './style.scss';

const Messages = React.createClass({
  renderMessage(message, i) {
    const classNames = {
      message: true,
      'is-users': localStorage.username && localStorage.username === message.username
    };
    classNames[`${ message.type }-message`] = true;

    return (
      <div key={ i } className={ classnames(classNames) }>
        <span className="username">{ message.username }</span>
        { message.text }
      </div>
    );
  },

  renderMessages() {
    return this.props.messages.map(this.renderMessage);;
  },

  render() {
    return (
      <div className="chatbox-messages">
        { this.renderMessages() }
      </div>
    );
  }
});

export default Messages;
