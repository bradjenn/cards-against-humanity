class Player {
  constructor(id, username) {
    this.id = id;
    this.username = username;
    this.connected = true;
    this.cards = [];
  }

  get cardIndexes() {
    return this.cards.map(c => c.index);
  }

  addWhiteCard(index) {
    this.cards.push(index);
  }
}

module.exports = Player;
