// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

// Get ipcRenderer so that window has access to send messages to the main process
window.ipcRenderer = require('electron').ipcRenderer;

const {getCurrentWindow} = require('electron').remote;
window.reload = () => {
  getCurrentWindow().reload()
}

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})
