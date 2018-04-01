import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Button } from 'primereact/components/button/Button';
import { Panel } from 'primereact/components/panel/Panel';
import { Spinner } from 'primereact/components/spinner/Spinner';

import { addDownloads } from '../actions/downloader';
import { setSelection } from '../actions/ftp';
import { setDownloadSplit } from '../actions/settings';

const FtpDirActionsBar = ({ disabled, selection, downloadSplit,
  setDownloadSplit, addDownloads, setSelection
}) => (
  <Panel>
    <form onSubmit={e => {
        e.preventDefault();
        // start downloading selected items
        addDownloads(selection);

        // clear the selection
        setSelection([]);
      }}
    >
      <fieldset>
        <div className="layout-container-horizontal">
          <div className="fixed-element"
            title="Specify how many parts will be split for a single file."
          >
            <label>Split:</label>
            <Spinner value={downloadSplit} size={2} min={1} max={16}
              onChange={e => setDownloadSplit(e.value)}
            />
          </div>
          <div className="auto-size-element" align="right">
            <Button disabled={disabled} type="submit"
              label="Download" icon="fa-download" title="Download Selected"
            />
          </div>
        </div>
      </fieldset>
    </form>
  </Panel>
);

FtpDirActionsBar.propTypes = {
  disabled: PropTypes.bool.isRequired,
  selection: PropTypes.PropTypes.arrayOf(PropTypes.string).isRequired,
  downloadSplit: PropTypes.number.isRequired,
  setDownloadSplit: PropTypes.func.isRequired,
  addDownloads: PropTypes.func.isRequired,
  setSelection: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  disabled: state.ftp.selection.length === 0,
  downloadSplit: state.settings.downloadSplit,
  selection: state.ftp.selection
});

const mapDispatchToProps = {
  setDownloadSplit,
  addDownloads,
  setSelection
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FtpDirActionsBar);
