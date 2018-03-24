/* eslint react/forbid-prop-types: 0 */
/* eslint react/prop-types: 0 */

import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'primereact/components/checkbox/Checkbox';

// HOC to add conditional checkboxes for DataTable
const checkboxTableHOC = (Component) => class extends React.Component {
  constructor(props) {
    super(props);

    // event handlers
    this.rowClassName = this.rowClassName.bind(this);
    this.onRowClick = this.onRowClick.bind(this);
    this.onToggleAll = this.onToggleAll.bind(this);
  }

  isSelected(item) {
    return (this.props.selection.includes(item[this.props.keyField]));
  }

  rowClassName(item) {
    return {
      'ui-state-highlight' : this.isSelected(item),
      'ui-row-toggler' : this.props.selectable(item)
    };
  }

  allSelected() {
    return (this.props.selection.length > 0)
        && (this.props.selection.length === this.selectableKeys.length);
  }

  renderHeadCheckbox() {
    return (
      <Checkbox
        onChange={e => this.onToggleAll(e.checked)}
        checked={this.allSelected()}
        disabled={this.selectableKeys.length === 0}
      />
    );
  }

  getTooltip(item) {
    return this.props.tooltip ? this.props.tooltip(item) : '';
  }

  renderRowCheckbox(item) {
    return (
      <div align="center" title={this.getTooltip(item)}>
        <Checkbox
          onChange={() => {}}   // doesn't need it since we've handled onRowClick
          checked={this.isSelected(item)}
          disabled={!this.props.selectable(item)}
        />
      </div>
    );
  }

  onRowClick(e) {
    const item = e.data;
    if (this.props.selectable(item)) {
      this.props.toggleSelection(item.name);
    }
  }

  onToggleAll(allSelected) {
    this.props.toggleAll(allSelected, this.selectableKeys);
  }

  render() {
    const {
      columns, keyField, value, selectable,
      ...rest
    } = this.props;

    // cache the keys
    this.selectableKeys = value.filter(x => selectable(x)).map(x => x[keyField]);

    // add a column for checkboxes
    const checkboxColumn = {
      header: this.renderHeadCheckbox(),
      field: '_checkbox',
      body: rowData => this.renderRowCheckbox(rowData),
      width: '2em',
      sortable: false
    };
    const columnsEx = [checkboxColumn, ...columns];

    return (
      <Component
        {...rest}
        columns={columnsEx}
        value={value}
        onRowClick={this.onRowClick}
        rowClassName={this.rowClassName}
      />
    );
  }
};

checkboxTableHOC.propTypes = {
  columns: PropTypes.array.isRequired,
  value: PropTypes.array.isRequired,
  keyField: PropTypes.string.isRequired,
  selection: PropTypes.array.isRequired,
  selectable: PropTypes.func.isRequired,
  toggleSelection: PropTypes.func.isRequired,
  toggleAll: PropTypes.func.isRequired,
  tooltip: PropTypes.func,
};

export default checkboxTableHOC;
