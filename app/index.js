import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { Provider } from 'react-redux';
import { configureStore } from './store/configureStore';
import App from './components/App';
import './assets/css/app.global.css';

const store = configureStore();

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
