import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SplitPane from 'react-split-pane';
import FtpAddressBar from './FtpAddressBar';
import LocalDirView from './LocalDirView';
import FtpDirView from './FtpDirView';
import DownloadQueue from './DownloadQueue';

import { setHSplitSize } from '../actions/ui';
import { setFileSizeFormat } from '../actions/settings';
import { startAria2, addDownloads } from '../actions/downloader';
import { loadLocalDir } from '../actions/localDir';
import { connectFtp, setSelection } from '../actions/ftp';
import { getDownloadSuggestions, downloadQueueEmpty } from '../actions/app';

const electron = require('electron');
const parseArgs = require('minimist');


class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.startIPCHandlers();
    this.startInitialTasks();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    // use setTimeout/clearTimeout to simulate a resizeEnd event
    clearTimeout(this.resizeEndEvent);
    this.resizeEndEvent = setTimeout(() => {
      // use window.innerHeight is not accurute, but it doesn't matter since
      // the only thing matters is that child components know height changed.
      this.props.setHSplitSize(window.innerHeight);
    }, 250);
  }

  startIPCHandlers() {
    const ipcRenderer = electron.ipcRenderer;

    // listen the event to control whether close the app.
    ipcRenderer.on('on-app-closing', () => {
      if (!this.props.downloadQueueEmpty()) {
        electron.remote.dialog.showMessageBox({
          type: 'question',
          buttons: ['&Yes', '&No'],
          title: 'Confirm',
          noLink: true,
          defaultId: 1,
          cancelId: 1,
          message: 'There\'re downloads still in the queue.\nDo you really want to quit?'
        }, resp => {
          // 'Yes' clicked, close the app
          if (resp === 0) ipcRenderer.send('allow-to-close');
        });
      } else {
        // nothing in the queue, close the app
        ipcRenderer.send('allow-to-close');
      }
    });

    // menu item event handlers
    ipcRenderer.on('file-size-format', (event, msg) => {
      this.props.setFileSizeFormat(msg);
    });
  }

  async startInitialTasks() {
    const {
      startAria2, loadLocalDir, connectFtp,
      getDownloadSuggestions, setSelection, addDownloads
    } = this.props;

    // get command line arguments
    const args = parseArgs(electron.remote.process.argv);
    console.log('command line arguments:', args);

    const preTasks = [];
    // start aria2c deamon during Application start up.
    preTasks.push(startAria2());

    // load the dir from command line or current dir.
    preTasks.push(loadLocalDir(args.local || '.'));

    // if there's FTP address passed from command line parameter, connect it.
    if (args.ftp) {
      preTasks.push(connectFtp(args.ftp));
    }

    // wait until all prerequisite tasks done
    let hasError = false;
    try {
      await Promise.all(preTasks);
    } catch (err) {
      console.error('Error happened during pretasks, give up rest command line tasks.', err);
      hasError = true;
    }

    if (!hasError && args.local && args.ftp &&
      (args['auto-select'] || args['auto-download'])) {
      // calcuate download suggestions
      const ftpItems = getDownloadSuggestions();
      const selection = ftpItems.filter(x => x.shouldDownload).map(x => x.name);
      console.log('to select/download:', selection);

      if (selection.length) {
        // auto select checkboxes
        if (args['auto-select']) {
          setSelection(selection);
        }

        // auto start downloads
        if (args['auto-download']) {
          addDownloads(selection);
        }
      }
    }
  }

  render() {
    return (
      <div className="root-container">
        <FtpAddressBar />
        <div className="splitpane-container">
          <SplitPane defaultSize="70%" split="horizontal" onDragFinished={this.props.setHSplitSize}>
            <SplitPane defaultSize="50%" split="vertical">
              <LocalDirView />
              <FtpDirView />
            </SplitPane>
            <DownloadQueue />
          </SplitPane>
        </div>
      </div>
    );
  }
}

App.propTypes = {
  setFileSizeFormat: PropTypes.func.isRequired,
  startAria2: PropTypes.func.isRequired,
  loadLocalDir: PropTypes.func.isRequired,
  connectFtp: PropTypes.func.isRequired,
  getDownloadSuggestions: PropTypes.func.isRequired,
  setSelection: PropTypes.func.isRequired,
  addDownloads: PropTypes.func.isRequired,
  downloadQueueEmpty: PropTypes.func.isRequired,
  setHSplitSize: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
  setFileSizeFormat,
  startAria2,
  loadLocalDir,
  connectFtp,
  getDownloadSuggestions,
  setSelection,
  addDownloads,
  downloadQueueEmpty,
  setHSplitSize,
};

export default connect(
  null,
  mapDispatchToProps
)(App);
