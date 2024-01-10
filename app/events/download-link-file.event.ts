import { ipcMain } from 'electron';
import { chromium, Page } from 'playwright';
import axios from 'axios';
import { GithubRelease } from '../../shared/models/github.model';
import { LinkModel } from '../../shared/models/aki-core.model';
import * as path from 'path';
import * as fs from 'fs';
import { DirectDownload } from '../../shared/models/download.model';

export interface GithubLinkData {
  userName: string;
  repoName: string;
  tag: string;
}

export const handleDownloadLinkEvent = () => {
  ipcMain.on('download-link', async (event, linkModel: LinkModel) => {
    let downloadLink = null;

    await (async () => {
      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.route('**/*', route => {
        if (
          route.request().resourceType() === 'stylesheet' ||
          route.request().resourceType() === 'font' ||
          route.request().resourceType() === 'image' ||
          route.request().resourceType() === 'media'
        ) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto(`https://hub.sp-tarkov.com/files/license/${linkModel.fileId}`);
      await page.click('[name="confirm"]');

      await page.click('div.formSubmit input[type="submit"]');
      await page.goto(`https://hub.sp-tarkov.com/files/file/${linkModel.fileId}`);

      const ankiTempDownloadDir = path.join(linkModel.akiInstancePath, '_temp');
      if (!fs.existsSync(ankiTempDownloadDir)) {
        fs.mkdirSync(ankiTempDownloadDir);
      }

      const downloadEventPromise = page
        .waitForEvent('download', { timeout: 1000 })
        .then(async download => {
          event.sender.send('download-mod-direct');
          return download;
        })
        .catch(() => false);

      const newPagePromise = context
        .waitForEvent('page', { timeout: 1000 })
        .then(p => p)
        .catch(() => false);

      const [newPage, downloadEvent] = await Promise.all([newPagePromise, downloadEventPromise, page.click('a.button.buttonPrimary.externalURL')]);

      if (typeof downloadEvent !== 'boolean') {
        const sourceFilePath = await downloadEvent.path();

        const destinationFileName = `copy.${downloadEvent.suggestedFilename()}`;
        const destinationFilePath = path.join(ankiTempDownloadDir, destinationFileName);

        fs.copyFile(sourceFilePath, destinationFilePath, async err => {
          if (err) {
            return;
          }

          const directDownload: DirectDownload = {
            savePath: destinationFilePath,
            totalBytes: fs.statSync(destinationFilePath).size.toString(),
            percent: 100,
          };
          event.sender.send('download-mod-direct-completed', directDownload);
        });
      }

      if (newPage === false) {
        // event.sender.send('download-link-error', 0);
        // TODO proper error handling
        await context.close();
        return;
      }

      await (newPage as Page).waitForLoadState('networkidle');

      downloadLink = await (newPage as Page).$eval('a[href]', e => e.getAttribute('href'));
      if (!downloadLink) {
        await context.close();
        return;
      }

      const isArchiveLink = isArchiveURL(downloadLink);
      if (!isArchiveLink) {
        const gitHubInformation = parseGitHubLink(downloadLink);
        if (!gitHubInformation) {
          return;
        }
        await getReleaseData(gitHubInformation)
          .then(async data => {
            const githubDownloadLink = data?.assets?.[0].browser_download_url;
            event.sender.send('download-link-completed', githubDownloadLink);
            await context.close();
            return;
          })
          .catch(err => console.error(err));
      }

      event.sender.send('download-link-completed', downloadLink);
      await context.close();
    })();
  });
};

function isArchiveURL(url: string): boolean {
  const extensions = ['zip', 'rar', '7z', 'tar', 'gz'];

  const urlSegments = url.split('/');
  const fileName = urlSegments[urlSegments.length - 1];

  const fileSegments = fileName.split('.');
  const fileExtension = fileSegments[fileSegments.length - 1];

  return extensions.includes(fileExtension);
}

function parseGitHubLink(url: string): GithubLinkData | null {
  const regex = /https:\/\/github\.com\/(.*?)\/(.*?)\/releases\/tag\/(.*)/;
  const matches = url.match(regex);

  if (matches && matches.length === 4) {
    return {
      userName: matches[1],
      repoName: matches[2],
      tag: matches[3],
    };
  } else {
    return null;
  }
}

async function getReleaseData({ tag, userName, repoName }: GithubLinkData) {
  const url = `https://api.github.com/repos/${userName}/${repoName}/releases/tags/${tag}`;

  try {
    const response = await axios.get<GithubRelease>(url);
    console.log('X-RateLimit-Remaining:', response.headers['x-ratelimit-remaining']);
    console.log('X-RateLimit-Reset:', response.headers['x-ratelimit-reset']);
    console.log('X-RateLimit-Limit:', response.headers['x-ratelimit-limit']);
    console.log('X-RateLimit-Used:', response.headers['x-ratelimit-used']);

    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
