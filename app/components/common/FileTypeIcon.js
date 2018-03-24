import React from 'react';
import PropTypes from 'prop-types';
import { getTypeIcon } from '../../utils/filetype';

const FileTypeIcon = ({ type }) => (
  <span className={`fa fa-${getTypeIcon(type)}-o`} />
);

FileTypeIcon.propTypes = {
  type: PropTypes.string,
};

export default FileTypeIcon;
