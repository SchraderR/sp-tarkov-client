import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { ipcMain } from 'electron';
import axios from 'axios';

export const handleUpdateModEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('update-mod-data', event => event.sender.send('update-mod-data-completed', store.get('modMetaData')));

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
//axios({
//  method: 'get',
//  url: `files/file/1062/#versions/`,
//  maxRedirects: 0,
//  headers: {
//    'Access-Control-Allow-Origin': '*',
//    'Access-Control-Allow-Headers': '*',
//    'Access-Control-Allow-Credentials': 'true',
//  },
//  beforeRedirect: (options, responseDetails) => {
//    console.log(options);
//    console.log(responseDetails);
//  },
//})
//  .then((response: AxiosResponse) => {
//    console.log(response.data);
//  })
//  .catch(error => {
//    console.log(error);
//  });
