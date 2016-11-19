import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actionCreators from '../actions';
import Main from './Main';

function mapStateToProps(state, ownProps) {
  const { query } = ownProps.location;
  return {
    query
  };
}

function mapDispatchToProps(dispatch) {
  const props = bindActionCreators(actionCreators, dispatch);
  props.dispatch = dispatch;
  return props;
}

const App = connect(
  mapStateToProps,
  mapDispatchToProps
)(Main);

export default App;
