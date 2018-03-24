/* eslint react/forbid-prop-types: 0 */
/* eslint react/prop-types: 0 */
/* eslint react/no-array-index-key: 0 */

import React from 'react';
import PropTypes from 'prop-types';
import { Column } from 'primereact/components/column/Column';

// HOC to set some common props for DataTable, and add a columns properties
const myDataTableHOC = (Component) => class extends React.Component {
  /* eslint no-useless-constructor: 0 */
  constructor(props) {
    super(props);
  }

  render() {
    const { columns, ...rest } = this.props;
    return (
      <Component
        {...rest}
        scrollable={true} scrollHeight="100% fixed"
        resizableColumns={true} columnResizeMode="expand"
        emptyMessage=""
      >
        {
          columns.map((c, index) => (
            <Column
              key={c.field + index}
              header={c.header}
              field={c.field}
              style={{ width: c.width }}
              sortable={'sortable' in c ? c.sortable : true} // default true
              body={c.body}
            />
          ))
        }
        {/* add a padding column to allow resizing last column */}
        <Column style={{ width: '1px' }} />
      </Component>
    );
  }
};

myDataTableHOC.propTypes = {
  columns: PropTypes.array.isRequired,
};

export default myDataTableHOC;
