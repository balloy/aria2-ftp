import { connect } from 'react-redux';
import { loadFtpDir } from '../actions/ftp';
import DirNavigator from './common/DirNavigator';

const mapStateToProps = (state) => ({
  currentDir: state.ftp.dir,
  disabled: state.ftp.isFetching || (!state.ftp.ftpClient)
});

const mapDispatchToProps = {
  loadDir: loadFtpDir
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DirNavigator);
