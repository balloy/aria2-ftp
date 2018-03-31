import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { Provider } from 'react-redux';
import { configureStore } from './store/configureStore';
import App from './components/App';
import { loadSettings } from './utils/settings';
import './assets/css/app.global.css';

const electron = require('electron');

// get settings from file
const settings = loadSettings();
// update menu status to match settings
electron.ipcRenderer.send('update-menu-state', settings);
// init store with settings
const store = configureStore({ settings });

render(
  <AppContainer>
    <Provider store={store}>
      <App />
    </Provider>
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./components/App', () => {
    render(
      <AppContainer>
        <Provider store={store}>
          <App />
        </Provider>,
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
