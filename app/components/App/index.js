import React from 'react';
import styles from './style.scss';
import { ChatBox } from '../';

const App = React.createClass({
  getInitialState() {
    return {
      connected: localStorage.username ? true : false
    };
  },

  componentWillMount() {
    const { socket, data } = this.props;
    socket.on('connect', this.connect);
    socket.on('user joined', this.connected);

    if (localStorage.username && localStorage.username.length) {
      socket.emit('adduser', localStorage.username);
    }
  },

  componentWillUnMount() {
    localStorage.clear();
  },

  connect() {
    this.props.socket.emit('join', window.location.pathname.substring(1));
  },

  connected() {
    this.setState({ connected: true });
  },

  onSubmit(evt) {
    evt.preventDefault();
    const input = this.refs.input;
    const username = input.value;
    localStorage.setItem('username', username);
    this.props.socket.emit('adduser', username);
  },

  renderContent() {
    const { socket } = this.props;

    if (!this.state.connected) {
      return (
        <form onSubmit={ this.onSubmit } className={ styles.form }>
          <input type="text" ref="input" placeholder="enter your username" />
        </form>
      );
    }

    return (
      <main className={ styles.main }>
        <div className="stage"></div>
        <ChatBox socket={ socket } />
      </main>
    );
  },

  render() {
    return this.renderContent();
  }
});

export default App;
