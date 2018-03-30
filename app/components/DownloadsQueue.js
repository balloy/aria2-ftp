/* eslint react/no-unused-prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AutoHintPanel from './common/AutoHintPanel';
import FileTypeIcon from './common/FileTypeIcon';

import { DataTable } from 'primereact/components/datatable/DataTable';
import myDataTableHOC from './common/myDataTableHOC';
const MyDataTable = myDataTableHOC(DataTable);

import { ProgressBar } from 'primereact/components/progressbar/ProgressBar';
import { ContextMenu } from 'primereact/components/contextmenu/ContextMenu';

import { getFileType } from '../utils/filetype';
import { formatSize, formatSpeed, formatETA } from '../utils/formatters';

import { Downloader } from '../api/downloader';

class DownloadsQueue extends React.Component {
  constructor() {
    super();
    this.state = {
      // initiate the state otherwise context menu gets error.
      contextItem: { status: '' }
    };
  }

  render() {
    const { downloader, items, sizeFormat } = this.props;

    // add derived fields
    const getEta = x => {
      if (x.status === 'complete') return 0;
      if (x.size && x.speed) {  // in transfer
        return (x.size - x.completedSize) / x.speed;
      }
      return Number.MAX_SAFE_INTEGER;
    };
    const itemsEx = items.map( x => ({
      ...x,
      progress: x.size ? (x.completedSize / x.size) : 0,
      eta: getEta(x)
    }));

    // define table columns
    const columns = [
      {
        header: 'Status',
        field: 'status',
        width: 120,
      },
      {
        header: 'File',
        field: 'name',
        width: 150,
        body: (rowData) => (
          <span>
            <FileTypeIcon type={getFileType(rowData.name)} />
            {rowData.name}
          </span>
        )
      },
      {
        header: 'Size',
        field: 'size',
        width: 100,
        body: (rowData) => formatSize(rowData.size, sizeFormat)
      },
      {
        header: 'Progress',
        field: 'progress',
        width: 150,
        body: (rowData) => <ProgressBar value={Math.floor(100 * rowData.progress)} />
      },
      {
        header: 'Speed',
        field: 'speed',
        width: 100,
        body: (rowData) => formatSpeed(rowData.speed, sizeFormat)
      },
      {
        header: 'ETA',
        field: 'eta',
        width: 80,
        body: (rowData) => (
          rowData.eta === Number.MAX_SAFE_INTEGER ? '?' : formatETA(rowData.eta)
        )
      },
      {
        header: 'Local',
        field: 'localDir',
        width: 150,
      },
      {
        header: 'Remote',
        field: 'url',
        width: 250,
      }
    ];

    // define table context menu
    const menuItems = [
      {
        label: 'Pause',
        icon: 'fa-pause-circle',
        command: () => downloader.pause(this.state.contextItem),
        disabled: !downloader.canPause(this.state.contextItem)
      },
      {
        label: 'Pause All',
        icon: 'fa-pause',
        command: () => downloader.pauseAll(),
        disabled: !downloader.canPauseAll()
      },
      {
        separator: true,
      },
      {
        label: 'Resume',
        icon: 'fa-play-circle',
        command: () => downloader.resume(this.state.contextItem),
        disabled: !downloader.canResume(this.state.contextItem)
      },
      {
        label: 'Resume All',
        icon: 'fa-play',
        command: () => downloader.resumeAll(),
        disabled: !downloader.canResumeAll()
      },
      {
        separator: true,
      },
      {
        label: 'Cancel',
        icon: 'fa-stop-circle',
        command: () => downloader.cancel(this.state.contextItem),
        disabled: !downloader.canCancel(this.state.contextItem)
      },
      {
        label: 'Cancel All',
        icon: 'fa-stop',
        command: () => downloader.cancelAll(),
        disabled: !downloader.canCancelAll()
      },
    ];

    return (
      <AutoHintPanel>
        <ContextMenu model={menuItems} appendTo="body" ref={el => { this.contextMenu = el; }} />
        <MyDataTable
          columns={columns}
          value={itemsEx}
          // sortField="status" sortOrder={1}   // default no sort
          contextMenu={this.contextMenu} selectionMode="single"
          /* Can't show selection -- the selected status gets reset by progress update.
          // selection={this.state.selectedItems}
          */
          onSelectionChange={e => this.setState({ contextItem: e.data })}
        />
      </AutoHintPanel>
    );
  }
}

DownloadsQueue.propTypes = {
  downloader: PropTypes.instanceOf(Downloader),
  items: PropTypes.arrayOf(PropTypes.shape({
    status: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    localDir: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    completedSize: PropTypes.number.isRequired,
    speed: PropTypes.number.isRequired,
    url: PropTypes.string.isRequired,
  })).isRequired,
  sizeFormat: PropTypes.string.isRequired,
  hSplitSize: PropTypes.number.isRequired,
};

const mapStateToProps = (state) => ({
  downloader: state.downloader,
  items: state.downloadQueue,
  sizeFormat: state.settings.fileSizeFormat,

  // just used to trigger componentDidUpdate event for sub-components
  hSplitSize: state.ui.hSplitSize,
});

export default connect(
  mapStateToProps,
  null
)(DownloadsQueue);
