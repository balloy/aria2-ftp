/*
Provides notification APIs.
*/
import React from 'react';
import ReactDOM from 'react-dom';
import { Growl } from 'primereact/components/growl/Growl';

export class Notifications {
  constructor() {
    console.log('Initiating Notifications module.');

    // create a container for growl
    const growlRoot = document.createElement('div');
    growlRoot.id = 'GrowlRoot';
    document.body.appendChild(growlRoot);

    // render the growl element in page
    ReactDOM.render(
      <Growl ref={el => { this.growl = el; }} position="bottomright" />,
      document.getElementById('GrowlRoot')
    );
  }

  info(summary, detail, sticky = false, life = 3000) {
    this.growl.show({ severity: 'info', summary, detail, sticky, life });
  }

  warn(summary, detail, sticky = false, life = 3000) {
    this.growl.show({ severity: 'warn', summary, detail, sticky, life });
  }

  // by default, error won't disappear automatically
  error(summary, detail, sticky = true, life = 3000) {
    this.growl.show({ severity: 'error', summary, detail, sticky, life });
  }
}

// export instance of Notifications directly
export default new Notifications();
