import React from 'react';
import styles from './style.scss';
import Messages from './Messages';
import Form from './Form';

const ChatBox = React.createClass({
  getInitialState() {
    return {
      messages: []
    };
  },

  componentWillMount() {
    this.props.socket.on('updatechat', this.updateChat);
  },

  updateChat(messages) {
    this.setState({ messages });
  },

  onSubmit(message) {
    this.props.socket.emit('sendchat', message);
  },

  render() {
    return (
      <div className="chatbox">
        <Messages messages={ this.state.messages } />
        <Form onSubmit={ this.onSubmit }/>
      </div>
    );
  }
});

export default ChatBox;
