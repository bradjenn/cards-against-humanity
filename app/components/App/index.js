import React from 'react';
import _ from 'lodash';
import styles from './style.scss';
import { ChatBox, Stage } from '../';

const App = React.createClass({

  getInitialState() {
    return {
      room: {
        players: {},
        messages: []
      }
    };
  },

  componentWillMount() {
    const { socket, data } = this.props;
    socket.on('connect', this.connect);
    socket.on('updateroom', this.updateRoom);

    if (localStorage.user) {
      socket.emit('adduser', JSON.parse(localStorage.user));
    }
  },

  componentWillUnMount() {
    localStorage.clear();
  },

  user() {
    let user = localStorage.user ? JSON.parse(localStorage.user) : {
      isConnected: false
    };

    return this.state.room.players[user.id] || user;
  },

  updateRoom(room) {
    this.setState({ room: room });
  },

  connect() {
    this.props.socket.emit('join', window.location.pathname.substring(1));
  },

  onSubmit(evt) {
    evt.preventDefault();
    const input = this.refs.input;
    const username = input.value;

    const user = {
      id: _.uniqueId(`${ username }-${ Math.floor(Date.now() / 1000) }`),
      username
    };

    localStorage.setItem('user', JSON.stringify(user));
    this.props.socket.emit('adduser', user);
  },

  renderContent() {
    const { socket, data } = this.props;
    const { room } = this.state;

    if (!this.user().isConnected) {
      return (
        <form onSubmit={ this.onSubmit } className={ styles.form }>
          <input type="text" ref="input" placeholder="enter your username" />
        </form>
      );
    }

    return (
      <main className={ styles.main }>
        <Stage room={ room } user={ this.user() } socket={ socket } data={ data } />
        <ChatBox user={ this.user() } socket={ socket } room={ room } />
      </main>
    );
  },

  render() {
    return this.renderContent();
  }
});

export default App;
