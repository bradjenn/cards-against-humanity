import React from 'react';
import styles from './style.scss';

const Form = React.createClass({
  onSubmit(evt) {
    evt.preventDefault();
    const input = this.refs.input;
    const message = input.value;
    input.value = '';

    this.props.onSubmit(message);
  },

  render() {
    return (
      <form onSubmit={ this.onSubmit } className="chatbox-form">
        <input type="text" placeholder="your message . . ." ref="input" />
        <button type="submit">Send</button>
      </form>
    );
  }
});

export default Form;
