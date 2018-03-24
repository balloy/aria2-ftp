import React from 'react';
import FtpDirNavigator from './FtpDirNavigator';
import FtpDirExplorer from './FtpDirExplorer';
import FtpDirActionsBar from './FtpDirActionsBar';

const FtpDirView = () => (
  <div className="layout-container-vertical full-height">
    <div>
      <FtpDirNavigator dirLabel="Remote:" model="ftpDirForm"  />
    </div>
    <div className="full-height">
      <FtpDirExplorer />
    </div>
    <div>
      <FtpDirActionsBar />
    </div>
  </div>
);

export default FtpDirView;
