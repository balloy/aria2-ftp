import React from 'react';

import LocalDirNavigator from './LocalDirNavigator';
import LocalDirExplorer from './LocalDirExplorer';

const LocalDirView = () => (
  <div className="layout-container-vertical full-height">
    <div>
      <LocalDirNavigator dirLabel="Local:" model="localDirForm" />
    </div>
    <div className="full-height">
      <LocalDirExplorer />
    </div>
  </div>
);

export default LocalDirView;
