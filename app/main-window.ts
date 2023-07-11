﻿import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindowSingleton } from './browserWindow';
import puppeteer from 'puppeteer';

export const createMainApiManagementWindow = (isServe: boolean): void => {
  console.log('createMainApiManagementWindow');
  // const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
  const externalDisplay = getExternalDisplay();

  let browserWindow: BrowserWindow | null = new BrowserWindow({
    /// main
    // x: 0,
    // y: 0,
    /// external
    x: externalDisplay!.bounds.x + 500,
    y: externalDisplay!.bounds.y + 250,
    width: 1600,
    height: 800,

    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: isServe,
      contextIsolation: false, // false if you want to run e2e test with Spectron
    },
  });

  browserWindow.webContents.openDevTools();

  // browserWindow.webContents.on('will-navigate', function (event, newUrl) {
  //   // More complex code to handle tokens goes here
  // });

  browserWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
  });

  browserWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Headers': ['*'],
        ...details.responseHeaders,
      },
    });
  });

  if (isServe) {
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
    void browserWindow.loadURL(url.href);
  }

  // Emitted when the window is closed.
  browserWindow.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    browserWindow = null;
  });

  BrowserWindowSingleton.setInstance(browserWindow);
  browserWindow.minimizable = true;
  browserWindow.minimize();
};

const getExternalDisplay = () => screen.getAllDisplays().find(display => display.bounds.x !== 0 || display.bounds.y !== 0);
