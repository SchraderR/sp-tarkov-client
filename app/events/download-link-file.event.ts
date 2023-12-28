import { ipcMain } from 'electron';
import { Page, launch, Browser } from 'puppeteer';
import { DownloadModel } from '../../shared/models/aki-core.model';

export interface EventFileArgs<T = any> {
  fileId: string;
  parameter: T;
}

export const handleDownloadLinkEvent = () => {
  ipcMain.on('download-link', (event, fileId: string) => {
    let downloadLink = null;

    (async () => {
      const browser = await launch({ headless: 'new' });
      const page = await browser.newPage();

      await page.goto(`https://hub.sp-tarkov.com/files/license/${fileId}`, { waitUntil: 'networkidle2' });
      await page.click('[name="confirm"]');
      await page.click('div.formSubmit input[type="submit"]');

      await page.goto(`https://hub.sp-tarkov.com/files/file/${fileId}`, { waitUntil: 'networkidle2' });
      await page.click('a.button.buttonPrimary.externalURL');

      const newPagePromise = getNewPageWhenLoaded(browser);
      const newPage: Page = await newPagePromise;

      downloadLink = await newPage.$eval('a[href]', e => e.getAttribute('href'));
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
