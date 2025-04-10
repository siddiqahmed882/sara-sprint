import puppeteer from 'puppeteer';
import { doctorLogin } from './_doctor-login.js';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 5,
  });

  const page = await browser.newPage();

  await doctorLogin(page);

  // Navigate to the "Create Lab Page" link
  const createLabPageLinkSelector = 'a[href="../MyLabsPage/MyLabsPage.html"]';
  await page.waitForSelector(createLabPageLinkSelector);
  await page.click(createLabPageLinkSelector);

  // Check if the labs table is present
  const labsTableSelector = '#labs-table-body';
  const labsTable = await page.$(labsTableSelector);
  if (!labsTable) {
    console.error('Labs table not found!');
    await browser.close();
    return;
  }

  // done with automation
  console.log('Labs table found!');
  await browser.close();
})();
