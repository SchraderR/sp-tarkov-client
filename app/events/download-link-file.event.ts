import { ipcMain } from 'electron';
import { Browser, launch, Page } from 'puppeteer';
import axios from 'axios';
import { GithubRelease } from '../../shared/models/github.model';

export interface EventFileArgs<T = any> {
  fileId: string;
  parameter: T;
}

export interface GithubLinkData {
  userName: string;
  repoName: string;
  tag: string;
}

export const handleDownloadLinkEvent = () => {
  ipcMain.on('download-link', (event, fileId: string) => {
    let downloadLink = null;

    (async () => {
      const browser = await launch({ headless: 'new' });
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

      await page.goto(`https://hub.sp-tarkov.com/files/license/${fileId}`, { waitUntil: 'networkidle2' });
      await page.click('[name="confirm"]');
      await page.click('div.formSubmit input[type="submit"]');

      await page.goto(`https://hub.sp-tarkov.com/files/file/${fileId}`, { waitUntil: 'networkidle2' });
      await page.click('a.button.buttonPrimary.externalURL');

      const newPagePromise = getNewPageWhenLoaded(browser);
      const newPage: Page = await newPagePromise;

      downloadLink = await newPage.$eval('a[href]', e => e.getAttribute('href'));
      if (!downloadLink) {
        await browser.close();
        return;
      }

      const isArchiveLink = isArchiveURL(downloadLink);
      if (!isArchiveLink) {
        const gitHubInformation = parseGitHubLink(downloadLink);
        console.log(gitHubInformation);
        if (!gitHubInformation) {
          //  TODO Error Handling
          // await browser.close();
          return;
        }
        await getReleaseData(gitHubInformation)
          .then(async data => {
            const githubDownloadLink = data?.assets?.[0].browser_download_url;
            console.log(githubDownloadLink);
            event.sender.send('download-link-completed', githubDownloadLink);
            await browser.close();
            return;
          })
          .catch(err => console.error(err));
      }

      event.sender.send('download-link-completed', downloadLink);
      await browser.close();
    })();
  });
};

const getNewPageWhenLoaded = async (browser: Browser) => {
  return new Promise<Page>(x =>
    browser.on('targetcreated', async target => {
      if (target.type() === 'page') {
        const newPage = await target.page();
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
