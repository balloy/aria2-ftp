import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Button } from 'primereact/components/button/Button';
import { Panel } from 'primereact/components/panel/Panel';

import { addDownloads } from '../actions/downloader';
import { setSelection } from '../actions/ftp';

const FtpDirActionsBar = ({ disabled, selection, addDownloads, setSelection }) => (
  <Panel>
    <form onSubmit={e => {
        e.preventDefault();
        // start downloading selected items
        addDownloads(selection);

        // clear the selection
        setSelection([]);
      }}
    >
      <fieldset disabled={disabled}>
        <div align="right" className="full-width">
          <Button type="submit" label="Download" icon="fa-download" />
        </div>
      </fieldset>
    </form>
  </Panel>
);

FtpDirActionsBar.propTypes = {
  disabled: PropTypes.bool.isRequired,
  selection: PropTypes.PropTypes.arrayOf(PropTypes.string).isRequired,
  addDownloads: PropTypes.func.isRequired,
  setSelection: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  disabled: state.ftp.selection.length === 0,
  selection: state.ftp.selection
});

const mapDispatchToProps = {
  addDownloads,
  setSelection
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FtpDirActionsBar);
