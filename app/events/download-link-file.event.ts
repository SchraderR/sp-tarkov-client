import { app, ipcMain } from 'electron';
import { Browser, launch, Page } from 'puppeteer';
import axios from 'axios';
import { GithubRelease } from '../../shared/models/github.model';
import { LinkModel } from '../../shared/models/spt-core.model';
import { Browser as Browsers, install } from '@puppeteer/browsers';
import { GithubRateLimit } from '../../shared/models/download.model';
import * as log from 'electron-log';

export interface GithubLinkData {
  userName: string;
  repoName: string;
  tag: string;
}

export const handleDownloadLinkEvent = () => {
  let browser: Browser;

  ipcMain.on('download-link', async (event, linkModel: LinkModel) => {
    let downloadLink: string | null = null;

    await install({
      browser: Browsers.CHROME,
      buildId: '127.0.6533.88',
      cacheDir: `${app.getPath('home')}/.local-chromium`,
    });

    if (linkModel.downloadUrl !== '') {
      downloadLink = linkModel.downloadUrl;
    }

    await (async () => {
      try {
        if (!downloadLink) {
          browser = await launch({
            headless: true,
            executablePath: `${app.getPath('home')}/.local-chromium/chrome/win64-127.0.6533.88/chrome-win64/chrome.exe`,
          });

          const page = await browser.newPage();
          await page.setRequestInterception(true);
          page.on('request', req => {
            if (
              req.resourceType() === 'stylesheet' ||
              req.resourceType() === 'font' ||
              req.resourceType() === 'image' ||
              req.resourceType() === 'media'
            ) {
              req.abort();
            } else {
              req.continue();
            }
          });

          // await page.goto(`https://hub.sp-tarkov.com/files/license/${linkModel.fileId}`, { waitUntil: 'networkidle2' });
          // await page.click('[name="confirm"]');
          // await page.click('div.formSubmit input[type="submit"]');

          page.on('response', response => {
            const status = response.status();
            if (status >= 300 && status <= 399) {
              if (
                response.headers()?.['location']?.includes('dev.sp-tarkov.com') ||
                response.headers()?.['location']?.includes('dev.sp-tarkov.com/attachments') ||
                response.headers()?.['location']?.includes('sp-tarkov.com/mod')
              ) {
                downloadLink = response.headers()['location'];
                event.sender.send('download-link-completed', downloadLink);
                return;
              }
            }
          });

          await page.goto(`https://hub.sp-tarkov.com/files/file/${linkModel.fileId}`, { waitUntil: 'networkidle2', timeout: 60000 });
          await page.click('a.button.buttonPrimary.externalURL');

          const newPagePromise = getNewPageWhenLoaded(browser);
          const newPage: Page = await newPagePromise;

          downloadLink = await newPage.$eval('a[href]', e => e.getAttribute('href'));
          if (!downloadLink) {
            event.sender.send('download-link-error', 0);
            return;
          }
        }

        const isMediaFireLink = isMediaFire(downloadLink);
        if (isMediaFireLink) {
          event.sender.send('download-link-error', 0);
          return;
        }

        const isDirectDllLink = isDirectDll(downloadLink);
        if (isDirectDllLink) {
          event.sender.send('download-link-completed', downloadLink);
          return;
        }

        const isDropBoxLink = isDropBox(downloadLink);
        if (isDropBoxLink) {
          downloadLink = downloadLink.replace('&dl=0', '&dl=1').replace('?dl=0', '?dl=1');
          event.sender.send('download-link-completed', downloadLink);
          return;
        }

        const isGoogleDriveLink = isGoogleDrive(downloadLink);
        if (isGoogleDriveLink) {
          let regex;
          if (downloadLink.includes('/file/d/')) {
            regex = /https:\/\/drive\.google\.com\/file\/d\/(.*?)\/view/;
          } else if (downloadLink.includes('/folders/')) {
            regex = /https:\/\/drive\.google\.com\/drive\/folders\/(.*?)(\/|$)/;
          } else if (downloadLink.includes('uc?export=download&id=')) {
            regex = /https:\/\/drive\.google\.com\/uc\?export=download&id=(.*?)(\/|$)/;
          }

          if (!regex) {
            event.sender.send('download-link-error', 0);
            return;
          }

          const match = downloadLink.match(regex);
          const id = match ? match[1] : null;

          if (id === null) {
            event.sender.send('download-link-error', 0);
            return;
          }

          downloadLink = `https://docs.google.com/uc?export=download&id=${id}`;
          event.sender.send('download-link-completed', downloadLink);
          return;
        }

        const isArchiveLink = isArchiveURL(downloadLink);
        if (!isArchiveLink) {
          const gitHubInformation = parseGitHubLink(downloadLink);
          if (!gitHubInformation) {
            event.sender.send('download-link-completed', downloadLink);
            return;
          }

          await getReleaseData(gitHubInformation, event)
            .then(async data => {
              const githubDownloadLink = data?.assets?.[0].browser_download_url;

              event.sender.send('download-link-completed', githubDownloadLink);

              return;
            })
            .catch(err => console.error(err));
        }

        event.sender.send('download-link-completed', downloadLink);
      } catch (e) {
        log.error(e);
        event.sender.send('download-link-error', 0);
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    })();
  });
};

const getNewPageWhenLoaded = async (browser: Browser) => {
  return new Promise<Page>(x =>
    browser.on('targetcreated', async target => {
      if (target.type() === 'page') {
        const newPage = await target.page();
        if (!newPage) return;

        const newPagePromise = new Promise<Page>(y => newPage.once('domcontentloaded', () => y(newPage)));
        const isPageLoaded = await newPage.evaluate(() => document.readyState);
        return isPageLoaded.match('complete|interactive') ? x(newPage) : x(newPagePromise);
      }
    })
  );
};

function isArchiveURL(url: string): boolean {
  const extensions = ['zip', 'rar', '7z', 'tar', 'gz'];

  const urlSegments = url.split('/');
  const fileName = urlSegments[urlSegments.length - 1];

  const fileSegments = fileName.split('.');
  const fileExtension = fileSegments[fileSegments.length - 1];

  return extensions.includes(fileExtension);
}

function isDirectDll(downloadLink: string) {
  return downloadLink.endsWith('.dll');
}

function isDropBox(downloadLink: string) {
  return downloadLink.includes('dropbox');
}

function isMediaFire(downloadLink: string) {
  return downloadLink.includes('mediafire');
}

function isGoogleDrive(downloadLink: string) {
  return downloadLink.includes('drive.google');
}

function parseGitHubLink(url: string): GithubLinkData | null {
  if (!url.endsWith('/')) {
    url = url + '/';
  }

  if (!url.endsWith('/releases')) {
    url = url + 'releases/latest/';
  }

  const regex = /https:\/\/github\.com\/(.*?)\/(.*?)\/releases\/(tag\/(.*))?/;
  const matches = url.match(regex);
  if (matches) {
    return {
      userName: matches[1],
      repoName: matches[2],
      tag: matches[3],
    };
  } else {
    return null;
  }
}

async function getReleaseData({ tag, userName, repoName }: GithubLinkData, event: Electron.IpcMainEvent) {
  const url = tag
    ? `https://api.github.com/repos/${userName}/${repoName}/releases/tags/${tag.split('/')[1]}`
    : `https://api.github.com/repos/${userName}/${repoName}/releases/latest`;

  try {
    const response = await axios.get<GithubRelease>(url);
    const githubRateLimit: GithubRateLimit = {
      remaining: response.headers['x-ratelimit-remaining'],
      reset: response.headers['x-ratelimit-reset'],
      limit: response.headers['x-ratelimit-limit'],
      used: response.headers['x-ratelimit-used'],
    };

    event.sender.send('github-ratelimit-information', githubRateLimit);

    return response.data;
  } catch (error) {
    log.error(error);
    event.sender.send('download-link-error', 0);
    return null;
  }
}

function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
