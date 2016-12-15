import React from 'react';
import _ from 'lodash';
import styles from './style.scss';
import { ChatBox, Stage } from '../';

const App = React.createClass({
  getInitialState() {
    return {
      name: '',
      messages: [],
      games: [],
      players: {},
      playerCount: 0,
      whiteCardsUsed: [],
      currentGame: {},
      currentRound: null
    };
  },

  componentWillMount() {
    const { socket, data } = this.props;
    socket.on('connect', this.connect);
    socket.on('updateroom', this.updateRoom);

    if (localStorage.user) {
      setTimeout(() => {
        socket.emit('adduser', JSON.parse(localStorage.user));
      }, 200);
    }
  },

  componentWillUnMount() {
    localStorage.clear();
  },

  user() {
    let user = localStorage.user ? JSON.parse(localStorage.user) : { id: null };
    if (this.state.players[user.id]) {
      return this.state.players[user.id];
    }

    return {};
  },

  updateRoom(update) {
    this.setState(update);
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

    if (this.state.players.length && _.isEmpty(this.user())) {
      return (
        <form onSubmit={ this.onSubmit } className={ styles.form }>
          <input type="text" ref="input" placeholder="enter your username" />
        </form>
      );
    }

    return (
      <main className={ styles.main }>
        <Stage { ...this.state } user={ this.user() } socket={ socket } data={ data } />
        <ChatBox user={ this.user() } socket={ socket } { ...this.state } />
      </main>
    );
  },

  render() {
    return this.renderContent();
  }
});

export default App;
