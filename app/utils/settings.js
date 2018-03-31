/* eslint no-restricted-syntax: 0 */

const electronSettings = require('electron-settings');

// map from state(reducer/settings) to settings in config file
const stateToSettingMap = {
  fileSizeFormat: 'display.file-size-format',
};

// read settings from config file
export const loadSettings = () => {
  const settings = {};
  for (const [state, setting] of Object.entries(stateToSettingMap)) {
    if (electronSettings.has(setting)) {
      settings[state] = electronSettings.get(setting);
    }
  }
  return settings;
};

// save current settings to config file
export const saveSettings = (settings) => {
  for (const [state, setting] of Object.entries(settings)) {
    electronSettings.set(stateToSettingMap[state], setting);
  }
};

//
// export const saveSetting = (state, value) => {
//   if (state in stateToSettingMap) {
//     electronSettings.set(stateToSettingMap[state], value);
//   } else {
//     throw new Error(`Unrecognized state name: ${state}`);
//   }
// };
