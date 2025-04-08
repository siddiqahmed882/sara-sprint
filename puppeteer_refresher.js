import puppeteer from "puppeteer";

//asynchronous IIFE (IMMEDIATELY INVOKED FUNCTION EXPRESSION)

(
    async () => {
        const browser = await puppeteer.launch({
            headless: false,
            slowMo: 70
        });

        const page = await browser.newPage();

        // goto the new page

        await page.goto('http://localhost:5000/Login-OTP/P-Login.html')

        // variables
        const email = 'input[name="email"]'
        const password = 'input[name="password"]'
        // const restaurantSelector = '.rllt__details [role="heading"] span'

        await page.waitForSelector(email)
        await page.click(email, { clickCount: 1 })
        await page.type(email, "patient01@gmail.com");
        
        await page.waitForSelector(password)
        await page.click(password, { clickCount: 1 })
        await page.type(password, "Patient@123");

        await page.keyboard.press("Enter");

        // await page.waitForSelector(restaurantSelector);

        // go ahead and scrape

        // const titles = await page.evaluate(
        //     (rs) => {
        //         const restaurantTitlesSpanTag = document.querySelectorAll(rs) //DOM
        //         const restaurantTitles = [...restaurantTitlesSpanTag].map(el => el.textContent)
        //         return restaurantTitles
        //     }, restaurantSelector)



        console.log("done with automation")

    }
)()