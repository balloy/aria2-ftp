/* eslint jsx-a11y/mouse-events-have-key-events: 0 */
/* eslint react/prop-types: 0 */

import React from 'react';
import { Panel } from 'primereact/components/panel/Panel';

const AutoHintPanel = (props) => (
  <Panel className="full-height">
    <div className="full-height"
      onMouseOver={e => {
        const o = e.target;
        if (o.tagName === 'TD' || o.tagName === 'TH') {
          o.title = (o.offsetWidth < o.scrollWidth) ? o.innerText : '';
        }
      }}
    >
      {props.children}
    </div>
  </Panel>
);

export default AutoHintPanel;
