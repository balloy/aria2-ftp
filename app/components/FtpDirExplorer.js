/* eslint react/no-unused-prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { loadFtpDir, toggleSelection, toggleAll } from '../actions/ftp';

import AutoHintPanel from './common/AutoHintPanel';
import FileTypeIcon from './common/FileTypeIcon';

import { DataTable } from 'primereact/components/datatable/DataTable';
import myDataTableHOC from './common/myDataTableHOC';
import checkboxTableHOC from './common/checkboxTableHOC';
// the HOCs sequence matters!
const MyCheckBoxTable = checkboxTableHOC(myDataTableHOC(DataTable));

import { formatSize, formatDateTime } from '../utils/formatters';
import { TYPE_FOLDER } from '../utils/fileType';

const FtpDirExplorer = ({
  errorMsg, isFetching, items,
  selection, toggleSelection, toggleAll,
  onOpenItem, sizeFormat
}) => {
  if (errorMsg) {
    // return <p>{errorMsg}</p>;
  }

  const columns = [
    {
      header: 'File',
      field: 'name',
      width: 200,
      body: (rowData) => (
        <span>
          <FileTypeIcon type={rowData.type} />
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
      header: 'Type',
      field: 'type',
      width: 80,
    },
    {
      header: 'Modified',
      field: 'modified',
      minWidth: 150,
      body: (rowData) => formatDateTime(rowData.modified)
    }
  ];

  // for checkboxTableHOC
  const checkboxProps = {
    keyField: 'name',
    selectable: item => item.type !== TYPE_FOLDER,
    selection,
    toggleSelection,
    toggleAll
  };

  return (
    <AutoHintPanel>
      <MyCheckBoxTable
        {...checkboxProps}
        columns={columns}
        value={items}
        loading={isFetching}
        sortField="name" sortOrder={1}
        onRowDoubleClick={e => {
          const item = e.data;
          if (item.type === TYPE_FOLDER) {
            onOpenItem(item.path);
          }
        }}
      />
    </AutoHintPanel>
  );
};

FtpDirExplorer.propTypes = {
  errorMsg: PropTypes.string,
  isFetching: PropTypes.bool.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number,
    type: PropTypes.string.isRequired,
    modified: PropTypes.instanceOf(Date).isRequired
  })).isRequired,
  selection: PropTypes.PropTypes.arrayOf(PropTypes.string).isRequired,
  sizeFormat: PropTypes.string.isRequired,
  hSplitSize: PropTypes.number.isRequired,
  onOpenItem: PropTypes.func.isRequired,
  toggleSelection: PropTypes.func.isRequired,
  toggleAll: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  errorMsg: state.ftp.errorMsg,
  isFetching: state.ftp.isFetching,
  items: state.ftp.items,
  selection: state.ftp.selection,
  sizeFormat: state.settings.fileSizeFormat,

  // just used to trigger componentDidUpdate event for sub-components
  hSplitSize: state.ui.hSplitSize,
});

const mapDispatchToProps = {
  onOpenItem: loadFtpDir,
  toggleSelection,
  toggleAll,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FtpDirExplorer);
