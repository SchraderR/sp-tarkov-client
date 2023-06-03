import { app, BrowserWindow, dialog, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as Store from 'electron-store';

let browserWindow: BrowserWindow | null = null;
const args = process.argv.slice(1);
const serve = args.some((val) => val === '--serve');

const stableAkiServerName = 'Aki.Server.exe';
const storeAkiRootDirectoryKey = 'akiRootDirectory';
const userSettingKey = 'userSetting';

const store = new Store();
store.set('userSetting', {});

ipcMain.on('open-directory', (event) => {
  if (!browserWindow) {
    console.error('BrowserWindow not valid');
    return;
  }
  console.log(app.getPath('userData'));

  dialog.showOpenDialog(browserWindow, { properties: ['openDirectory'] }).then((selectedDirectoryValue) => {
    const selectedPath = selectedDirectoryValue.filePaths[0];

    if (fs.existsSync(selectedPath)) {
      fs.readdir(selectedPath, (err, files) => {
        const isAKiRootDirectorySoftCheck = files.some((f) => f === stableAkiServerName);

        if (isAKiRootDirectorySoftCheck) {
          store.set(`${userSettingKey}.${storeAkiRootDirectoryKey}`, selectedPath);
          event.sender.send('open-directory-complete', files);
        } else {
          // TODO SOFT CHECK FALSE RE-EVALUATE
        }
      });
    }
  });
});

ipcMain.on('user-settings', (event) => event.sender.send('user-settings-complete', store.get(userSettingKey)));

// main start
try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (browserWindow === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}

const createWindow = (): BrowserWindow => {
  const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
  const externalDisplay = getExternalDisplay();

  // Create the browser window.
  browserWindow = new BrowserWindow({
    // main
    // x: 0,
    // y: 0,
    // external
    x: externalDisplay!.bounds.x + 500,
    y: externalDisplay!.bounds.y + 250,
    width: 1600,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      contextIsolation: false, // false if you want to run e2e test with Spectron
    },
  });

  if (serve) {
    browserWindow.webContents.openDevTools();
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    browserWindow.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    browserWindow.loadURL(url.href);
  }

  // Emitted when the window is closed.
  browserWindow.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    browserWindow = null;
  });

  return browserWindow;
};
const getExternalDisplay = () => screen.getAllDisplays().find((display) => display.bounds.x !== 0 || display.bounds.y !== 0);
