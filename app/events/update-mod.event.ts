import { ipcMain } from 'electron';
import * as Store from 'electron-store';
import { ModCache, ModMeta, UpdateModMeta, UserSettingStoreModel } from '../../shared/models/user-setting.model';
import * as jsdom from 'jsdom';
import axios from 'axios';

export const handleUpdateModEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('update-mod-data', (event, instancePath: string) => {
    const instances = store.get('sptInstances');
    const activeInstance = instances.find(i => i.sptRootDirectory === instancePath);

    if (activeInstance) {
      // TODO for testing REMOVE LATER
      activeInstance.trackedMods = activeInstance.trackedMods.splice(13);
      console.log(activeInstance.trackedMods.length);

      activeInstance.trackedMods.forEach(async mod => {
        if (mod.nextUpdateCheck < new Date().toISOString()) {
          console.log(`check Mod for ${mod.modName}`);

          const hubLink = await getHubModLink(mod.hubId);
          const modVersionData = await getModVersionData(hubLink);

          const dom = new jsdom.JSDOM(modVersionData.data);
          const firstFilebaseVersion = dom.window.document.querySelector('.filebaseVersion .containerHeadline h3');
          const h3Text = firstFilebaseVersion?.textContent;
          console.log(h3Text?.trim());
        }
      });
    }

    //
    // console.log(ttt);
    // new DOMParser().parseFromString('hubViewData', 'text/html');
  });
};

async function getModVersionData(link: string) {
  const response = await axios<string>({
    url: `${link}/#versions`,
    method: 'get',
    timeout: 20000,
    maxRedirects: 0,
    validateStatus: (status: number) => status >= 200 && status < 400,
  });

  return response;
}

async function getHubModLink(hubId: string) {
  const hubLink = buildHubLink(hubId);

  const response = await axios({
    url: hubLink,
    method: 'get',
    timeout: 20000,
    maxRedirects: 0,
    validateStatus: (status: number) => status >= 200 && status < 400,
  });

  return response.headers['location'];
}

function buildHubLink(hubId: string) {
  return `https://hub.sp-tarkov.com/files/file/${hubId}`;
}

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
