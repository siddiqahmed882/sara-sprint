import puppeteer from 'puppeteer';
import { donorLogin } from './_donor-login.js';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 5,
  });

  const page = await browser.newPage();

  await donorLogin(page);

  // Navigate to "My Donations" page
  const myDonationsPageSelector = 'a[href="../DonationsPgae/MyDonations.html"]';
  await page.waitForSelector(myDonationsPageSelector);
  await page.click(myDonationsPageSelector);

  // Wait for table to render donations (network + DOM ready)
  await page.waitForSelector('#donations-table-body');

  const donationsTable = await page.$(myDonationsPageSelector);
  if (!donationsTable) {
    console.error('Donations table not found!');
    await browser.close();
    return;
  }

  // done with automation
  console.log('Donations table found!');
  await browser.close();
})();
