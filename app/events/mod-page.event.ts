import { ipcMain } from 'electron';
import axios, { AxiosResponse } from 'axios';

export const handleModPageEvents = () => {
  ipcMain.on('get-mod-page', (event, modId: string, id: string) => {
    axios({
      method: 'get',
      url: `https://hub.sp-tarkov.com/files/file/${modId}`,
      validateStatus: (status: number) => status >= 200 && status < 400,
      maxRedirects: 0,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
      .then(response => event.sender.send(`get-mod-page-completed-${id}`, response.headers['location']))
      .catch(() => event.sender.send(`get-mod-page-error-${id}`));
  });
};
