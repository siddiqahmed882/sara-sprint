import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 5,
  });

  const page = await browser.newPage();

  // goto the new page

  await page.goto('http://localhost:5000/Login-OTP/Dn-Login.html');

  // LOGIN PAGE
  // variables
  const email = 'input[name="email"]';
  const password = 'input[name="password"]';

  await page.waitForSelector(email);
  await page.click(email, { clickCount: 1 });
  await page.type(email, 'test-donor@gmail.com');

  await page.waitForSelector(password);
  await page.click(password, { clickCount: 1 });
  await page.type(password, '123456789');

  await page.keyboard.press('Enter');

  // OTP PAGE
  // variables
  const otp = 'input[name="otp"]';

  await page.waitForSelector(otp);
  await page.click(otp, { clickCount: 1 });
  await page.type(otp, '124124');

  await page.keyboard.press('Enter');

  const editButton = 'button#edit-btn';
  await page.waitForSelector(editButton);
  await page.evaluate((btn) => btn?.click(), await page.$(editButton));

  // FEEDBACK PAGE
  // variables
  const editPassword = 'input[id="password"]';
  const confirmPassword = 'input[id="confirm-password"]';
  const editName = 'input[id="full-name"]';

  await page.waitForSelector(editPassword);
  await page.click(editPassword, { clickCount: 1 });
  await page.type(editPassword, '123456789');

  await page.waitForSelector(confirmPassword);
  await page.click(confirmPassword, { clickCount: 1 });
  await page.type(confirmPassword, '123456789');

  await page.waitForSelector(editName);
  await page.click(editName, { clickCount: 1 });
  await page.evaluate((input) => {
    if (input) {
      input.value = 'Donor Edit Test';
    }
  }, await page.$(editName));

  // Click the submit button
  const submitButton = 'button[type="submit"]';
  await page.waitForSelector(submitButton);
  await page.click(submitButton);

  console.log('done with automation');
})();
