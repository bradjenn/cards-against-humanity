import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { createStore, compose, applyMiddleware } from 'redux';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { browserHistory } from 'react-router';

import rootReducer from './reducers/index';


const middleware = [
  thunkMiddleware,
  routerMiddleware(browserHistory)
];

if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger());
}

const composeParams = [applyMiddleware(...middleware)];
if (process.env.NODE_ENV !== 'production' && window.devToolsExtension) {
  composeParams.push(window.devToolsExtension());
}

const store = createStore(
  rootReducer,
  compose(...composeParams)
);

export const history = syncHistoryWithStore(browserHistory, store);

export default store;
