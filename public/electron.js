const {app, BrowserWindow, ipcMain, Menu, shell} = require('electron')
const {autoUpdater} = require("electron-updater");
const path = require('path');
const {download} = require('electron-dl');
const url = require('url');
const isDev = require('electron-is-dev');
const isMac = process.platform === 'darwin';

let mainWindow;
let legacyWindow;

let shouldNotify = false;

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');

app.on('ready', function() {
  createMainWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

function createMainWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1048,
    height: 775,
    title: 'Sewer Watch',
    icon: 'favicon.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.on('closed', () => mainWindow = null);

  var menu = Menu.buildFromTemplate([
    (isMac ? {
      label: app.name,
      submenu: [
        {
          label: 'Open On-Device App',
          click() {
            openLegacyApp()
          }
        },
        {
          label: 'Check for update',
          click() {
            shouldNotify = true;
            autoUpdater.checkForUpdatesAndNotify();
          }
        },
        { type: 'separator' },
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    } 
    : 
    {
      label: "Menu",
      submenu: [
        {
          label: 'Open On-Device App',
          click() {
            openLegacyApp()
          }
        },
        {
          label: 'Check for update',
          click() {
            shouldNotify = true;
            autoUpdater.checkForUpdatesAndNotify();
          }
        },
        {type: 'separator'},
        {
          label: 'Sewer Watch Desktop ' + app.getVersion() 
        },
        {type:'separator'}, 
        {
            label:'Exit', 
            click() { 
                app.quit() 
            } 
        }
      ]
    }),
    // {
    //   label: 'Sewer Watch',
    //   role: 'appMenu'
    // },
    {
      label: 'File',
      submenu: [
          {
            label:'Download iTracker Firmware v4.1.4',
            click() {
              downloadFirmware()
            }
          },
          {
            label:'Download iTracker Manual',
            click() {
              downloadiTrackerManual()
            } 
          },
          {
            label:'Download SewerWatch Manual',
            click() {
              downloadSewerWatchManual()
            }
          }
      ]
    }, 
    {
      label: 'Edit',
      role: 'editMenu'
    }, 
    {
      label: 'View',
      role: 'viewMenu'
    }, 
    {
      label: 'Window',
      role: 'windowMenu'
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Eastech Flow Controls Website',
          click() { 
            shell.openExternal('http://eastechflow.com')
          },
        },
        {
          label: 'SmartWasteWater.com',
          click() { 
            shell.openExternal('http://smartwastewater.com')
          },
        }
      ]
    }

  ])
  Menu.setApplicationMenu(menu); 

  // Open the DevTools.s
  // mainWindow.webContents.openDevTools()
  if(legacyWindow) {
    legacyWindow.close()
  }
  
}

function createLegacyWindow () {
  // Create the browser window.
  legacyWindow = new BrowserWindow({
    width: 1048,
    height: 775,
    title: 'On-Device App',
    icon: 'favicon.ico'
  })

  legacyWindow.loadURL("http://eastechiq.com");
  legacyWindow.on('closed', () => legacyWindow = null);

  var menu = Menu.buildFromTemplate([
    (isMac ? {
      label: app.name,
      submenu: [
        {
          label: 'Open App Home Page',
          click() {
            openMainApp()
          }
        },
        {
          label: 'Check for update',
          click() {
            shouldNotify = true;
            autoUpdater.checkForUpdatesAndNotify();
          }
        },
        { type: 'separator' },
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    } 
    : 
    {
      label: "Menu",
      submenu: [
        {
          label: 'Open App Home Page',
          click() {
            console.log("OPEN APP");
          }
        },
        {
          label: 'Check for update',
          click() {
            shouldNotify = true;
            autoUpdater.checkForUpdatesAndNotify();
          }
        },
        {type: 'separator'},
        {
          label: 'Sewer Watch Desktop ' + app.getVersion() 
        },
        {type:'separator'}, 
        {
            label:'Exit', 
            click() { 
                app.quit() 
            } 
        }
      ]
    }),
    // {
    //   label: 'Sewer Watch',
    //   role: 'appMenu'
    // },
    {
      label: 'File',
      submenu: [
          {
            label:'Download iTracker Firmware v4.1.4',
            click() {
              downloadFirmware()
            }
          },
          {
            label:'Download iTracker Manual',
            click() {
              downloadiTrackerManual()
            } 
          },
          {
            label:'Download SewerWatch Manual',
            click() {
              downloadSewerWatchManual()
            }
          }
      ]
    }, 
    {
      label: 'Edit',
      role: 'editMenu'
    }, 
    {
      label: 'View',
      role: 'viewMenu'
    }, 
    {
      label: 'Window',
      role: 'windowMenu'
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Eastech Flow Controls Website',
          click() { 
            shell.openExternal('http://eastechflow.com')
          },
        },
        {
          label: 'SmartWasteWater.com',
          click() { 
            shell.openExternal('http://smartwastewater.com')
          },
        }
      ]
    }

  ])
  Menu.setApplicationMenu(menu); 
  if(mainWindow) {
    mainWindow.close();
  }
  
  // Open the DevTools.s
  // mainWindow.webContents.openDevTools()
}


async function downloadFirmware() {
  await download(mainWindow, 'https://github.com/eastechflow/iTrackerFirmware/archive/v4.1.3.zip');
}

async function downloadiTrackerManual() {
  await download(mainWindow, 'https://github.com/eastechflow/EastechManuals/raw/master/itracker-iom-manual.pdf');
}

async function downloadSewerWatchManual() {
  await download(mainWindow, 'https://github.com/eastechflow/EastechManuals/raw/master/sewerwatch-manual.pdf');
}

function openLegacyApp() {
  createLegacyWindow()
}

function openMainApp() {
  createMainWindow()
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('OpenLegacyApp', () => {
  console.log("OPENING LEGACY")
  openLegacyApp();
});
  

// ipcMain.on('update-version', (event, arg) => {
//   console.log("Reloading");
//   var url = arg + '/index.html'; 

//   mainWindow.loadFile(url);
// })

function sendStatusToWindow(text) {
  mainWindow.webContents.send('message', text);
}

autoUpdater.on('checking-for-update', () => {
  if(shouldNotify) {
    sendStatusToWindow('Checking for update...');
  }
  
})

autoUpdater.on('update-not-available', (info) => {
  if(shouldNotify) {
    sendStatusToWindow('Up to date.');
    shouldNotify = false;
  }
})

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Downloading Update...');
})

autoUpdater.on('update-downloaded', (ev, info) => {
  sendStatusToWindow('Update downloaded. Will install on next launch.')
})

// autoUpdater.on('error', (err) => {
//   sendStatusToWindow('Error in auto-updater. ' + err);
// })

// autoUpdater.on('download-progress', (progressObj) => {
//   let log_message = "Download speed: " + progressObj.bytesPerSecond;
//   log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
//   log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
//   sendStatusToWindow(log_message);
// })

// autoUpdater.on('update-downloaded', (info) => {
//   sendStatusToWindow('Update downloaded');
// });
