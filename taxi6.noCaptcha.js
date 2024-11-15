import { config } from 'dotenv';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

config();

async function timeUntilNextHour() {
    const now = new Date();
    
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    const currentMilliseconds = now.getMilliseconds();
    
    const millisecondsUntilNextHour = 
        ((60 - currentMinutes) * 60 * 1000) -
        (currentSeconds * 1000) -            
        currentMilliseconds;                 

    console.log('time in MS until next hour', (millisecondsUntilNextHour - 200));
    if (millisecondsUntilNextHour - 200 > 0) {
        await sleep(200);
    }
}

async function signin(browser) {
    const page = await browser.newPage();
    await page.goto('https://bus-med.1337.ma/api/auth/42');
    await page.type('#username', process.env.USERNAME);
    await page.type('#password', process.env.PASSWORD);
    await page.click('#kc-login');
    await timeUntilNextHour();
    await page.reload({ waitUntil: 'networkidle0' });
    return page;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: process.env.BROWSER_MODE === 'headless'
    });

    const page = await signin(browser);
    const Allbuses = '.bg-white.rounded-xl.shadow-lg';
    await page.waitForSelector(Allbuses, { timeout: 5000 });
    const buses = await page.$$('.bg-white.rounded-xl.shadow-lg');
    for (let bus of buses) {
        await bus.waitForSelector('.flex.items-center.justify-between .text-center:last-child', { timeout: 5000 });

        const destination = await bus.$eval('.flex.items-center.justify-between .text-center:last-child', el => el.innerText);
        console.log('|' + destination.replace(/^TO\n\n/, '') + '|');
    
        if (destination.replace(/^TO\n\n/, '') === 'MARTIL') {
            console.log("Martil bus found. Booking seat...");
            const bookButton = await bus.$('button.bg-green-500');
            await bookButton.click();
            const buttonSelector = 'button[data-slot="trigger"]';
            await page.waitForSelector(buttonSelector);
            await page.click(buttonSelector);
            await page.click('.w-full.relative.flex.flex-col.gap-1.p-1:first-child');
            await page.evaluate(() => {
                const button = document.querySelector('form button[type="submit"]');
                button.click();
            });
            console.log('----------SEAT HAS BEEN BOOKED :)----------');
            break;
        }
    }
    // await browser.close();
})();
