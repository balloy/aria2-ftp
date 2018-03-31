import React from 'react';
import PropTypes from 'prop-types';
import { getTypeIcon } from '../../utils/fileType';

const FileTypeIcon = ({ type }) => (
  <span className={`fiv-cla fiv-icon-${getTypeIcon(type)}`} />
);

FileTypeIcon.propTypes = {
  type: PropTypes.string,
};

export default FileTypeIcon;
