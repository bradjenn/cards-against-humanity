import React from 'react';
import styles from './style.scss';
import Messages from './Messages';
import Form from './Form';

const ChatBox = React.createClass({
  onSubmit(message) {
    this.props.socket.emit('sendchat', message);
  },

  render() {
    return (
      <div className="chatbox">
        <Messages user={ this.props.user } messages={ this.props.messages } />
        <Form onSubmit={ this.onSubmit }/>
      </div>
    );
  }
});

export default ChatBox;
