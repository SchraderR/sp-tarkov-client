import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { ipcMain } from 'electron';
import axios, { AxiosResponse } from 'axios';

export const handleUpdateModEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('update-mod-data', (event, hubId) => {
    axios({
      url: `https://hub.sp-tarkov.com/files/file/${hubId}/#versions`,
      method: 'get',
      timeout: 20000,
      maxRedirects: 0,
      responseType: 'text',
      validateStatus: (status: number) => status >= 200 && status < 400,
    })
      .then(r => {
        console.log(r);
        console.log(r.headers['location']);
        event.sender.send('update-mod-data-completed', r.headers['location']);
      })
      .catch(e => console.log(e));
  });

  ipcMain.on('update-mod-data_old', event => {
    axios({
      url: 'https://hub.sp-tarkov.com/files/file/1062/#versions',
      method: 'get',
      timeout: 20000,
      maxRedirects: 0,
      validateStatus: (status: number) => status >= 200 && status < 400,
    }).then(r => {
      console.log(r.headers['location']);
      event.sender.send('update-mod-data-completed', r.headers['location']);
    });
  });
};
