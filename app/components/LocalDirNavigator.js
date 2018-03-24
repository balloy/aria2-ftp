import { connect } from 'react-redux';
import { loadLocalDir } from '../actions/localDir';
import DirNavigator from './common/DirNavigator';

const mapStateToProps = (state) => ({
  currentDir: state.localDir.dir,
  disabled: state.localDir.isFetching
});

const mapDispatchToProps = {
  loadDir: loadLocalDir
};

const LocalDirNavigator = connect(
  mapStateToProps,
  mapDispatchToProps
)(DirNavigator);

export default LocalDirNavigator;
