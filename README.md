# Cards Against Humanity online

My attempt at creating an online version of Cards Against Humanity.
Huge thanks to [Chris Hallberg](http://www.crhallberg.com/) for sorting out the [JSON](http://www.crhallberg.com/cah/json)
so i didn't have to! :)

### Setup

Using [npm](https://www.npmjs.com/):

    $ npm install

### Making changes

#### Install the Heroku CLI

Download and install the [Heroku
CLI](https://devcenter.heroku.com/articles/heroku-cli).

If you haven't already, log in to your Heroku account and follow the prompts to create a new SSH public key.

    $ heroku login

#### Clone the repository

Use Git to clone
[cardsagainst-humanity's](https://github.com/bradjenn/cards-against-humanity) source code to your local machine.

    $ heroku git:clone -a cardsagainst-humanity
    $ cd cardsagainst-humanity

#### Deploy your changes

Make some changes to the code you just cloned and deploy them to Heroku using Git.

    $ git add .
    $ git commit -am "make it better"
    $ git push heroku master

### Is this legal? Yes i think so.
[Cards Against Humanity](https://cardsagainsthumanity.com/) is distributed under a [Creative Commons BY-NC-SA 2.0 license](https://creativecommons.org/licenses/by-nc-sa/2.0/).
That means you can use, remix, and share the game for free, but you can't sell it without permission.
Consult their [FAQ](https://cardsagainsthumanity.com/#info) if you don't believe it.


### Want to help?
Do it! Happy for anyone to get involved, just give me a shout
