/* eslint react/no-unused-prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AutoHintPanel from './common/AutoHintPanel';
import FileTypeIcon from './common/FileTypeIcon';

import { DataTable } from 'primereact/components/datatable/DataTable';
import myDataTableHOC from './common/myDataTableHOC';
const MyDataTable = myDataTableHOC(DataTable);

import { formatSize, formatDateTime } from '../utils/formatters';
import { TYPE_FOLDER } from '../utils/filetype';

import { loadLocalDir } from '../actions/localDir';

const LocalDirExplorer = ({ errorMsg, isFetching, items, sizeFormat, onOpenItem }) => {
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

  return (
    <AutoHintPanel>
      <MyDataTable
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

LocalDirExplorer.propTypes = {
  errorMsg: PropTypes.string,
  isFetching: PropTypes.bool.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number,
    type: PropTypes.string,
    modified: PropTypes.instanceOf(Date)
  })).isRequired,
  sizeFormat: PropTypes.string.isRequired,
  hSplitSize: PropTypes.number.isRequired,
  onOpenItem: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  errorMsg: state.localDir.errorMsg,
  isFetching: state.localDir.isFetching,
  items: state.localDir.items,
  sizeFormat: state.settings.fileSizeFormat,

  // just used to trigger componentDidUpdate event for sub-components
  hSplitSize: state.ui.hSplitSize,
});

const mapDispatchToProps = {
  onOpenItem: loadLocalDir
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LocalDirExplorer);
