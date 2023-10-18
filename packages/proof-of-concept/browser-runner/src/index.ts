import {mkdir, writeFile} from 'fs/promises';
import {join} from 'path';
import {webkit} from 'playwright';
import {screenshotsDir} from './repo-paths';

async function main() {
    const browser = await webkit.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:5643');

    await page.locator('toniq-nft-frame.hide-loading').first().waitFor();

    const screenshotBuffer = await page.locator('toniq-nft-frame').first().screenshot();
    await mkdir(screenshotsDir, {recursive: true});
    await writeFile(join(screenshotsDir, `${Date.now()}.png`), screenshotBuffer);
    await browser.close();
}

main();
