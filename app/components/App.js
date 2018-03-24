import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SplitPane from 'react-split-pane';
import FtpAddressBar from './FtpAddressBar';
import LocalDirView from './LocalDirView';
import FtpDirView from './FtpDirView';
import DownloadsQueue from './DownloadsQueue';

import { setHSplitSize } from '../actions/ui';
import { setFileSizeFormat } from '../actions/settings';
import { startAria2, refreshDownloadsStatus, startDownloads } from '../actions/downloader';
import { loadLocalDir } from '../actions/localDir';
import { connectFtp, setSelection } from '../actions/ftp';
import { getDownloadSuggestions } from '../actions/app';

const electron = require('electron');
const parseArgs = require('minimist');


class App extends React.Component {
  componentDidMount() {
    this.startMenuHandlers();
    this.startInitialTasks();
  }

  startMenuHandlers() {
    const ipcRenderer = electron.ipcRenderer;

    ipcRenderer.on('file-size-format', (event, msg) => {
      this.props.setFileSizeFormat(msg);
    });
  }

  async startInitialTasks() {
    const {
      startAria2, loadLocalDir, connectFtp,
      refreshDownloadsStatus,
      getDownloadSuggestions, setSelection, startDownloads
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
          startDownloads(selection);
        }
      }
    }

    // refresh downloading status every 1 second.
    setInterval(refreshDownloadsStatus, 1000);
  }

  render() {
    return (
      <div className="root-container">
        <FtpAddressBar />
        <div className="splitpane-container">
          <SplitPane defaultSize="70%" split="horizontal" onChange={this.props.setHSplitSize}>
            <SplitPane defaultSize="50%" split="vertical">
              <LocalDirView />
              <FtpDirView />
            </SplitPane>
            <DownloadsQueue />
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
  refreshDownloadsStatus: PropTypes.func.isRequired,
  getDownloadSuggestions: PropTypes.func.isRequired,
  setSelection: PropTypes.func.isRequired,
  startDownloads: PropTypes.func.isRequired,
  setHSplitSize: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
  setFileSizeFormat,
  startAria2,
  loadLocalDir,
  connectFtp,
  refreshDownloadsStatus,
  getDownloadSuggestions,
  setSelection,
  startDownloads,
  setHSplitSize,
};

export default connect(
  null,
  mapDispatchToProps
)(App);
