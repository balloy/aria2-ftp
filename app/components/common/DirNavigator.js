
import React from 'react';
import PropTypes from 'prop-types';

import { InputText } from 'primereact/components/inputtext/InputText';
import { Button } from 'primereact/components/button/Button';
import { Panel } from 'primereact/components/panel/Panel';
import { Form, Control } from 'react-redux-form';

const path = require('path');

const DirNavigator = ({ dirLabel, model, currentDir, disabled, loadDir }) => (
  <Panel>
    <Form model={model} onSubmit={data => loadDir(data.dir)}>
      <fieldset disabled={disabled}>
        <div className="layout-container-horizontal">
          <div className="fixed-element" style={{ paddingTop: '0.33em' }}>
            <label>{dirLabel}</label>
          </div>
          <div className="auto-size-element">
            <Control model={`${model}.dir`} component={InputText} className="full-width" />
          </div>
          <div className="fixed-element">
            <Button type="submit" icon="fa-refresh" />
            <Button icon="fa-arrow-up"
              onClick={e => {
                e.preventDefault();
                loadDir(path.dirname(currentDir));
              }}
            />
          </div>
        </div>
      </fieldset>
    </Form>
  </Panel>
);

DirNavigator.propTypes = {
  dirLabel: PropTypes.string.isRequired,
  model: PropTypes.string.isRequired,
  currentDir: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  loadDir: PropTypes.func.isRequired
};

export default DirNavigator;
