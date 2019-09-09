var channels = require('./YoutubeChannelList')
const puppeteer = require('puppeteer');

async function openAllVideos(categories) {
    const browser = await puppeteer.launch({
        headless: false, args: ['--start-maximized'] // Puppeteer is 'headless' by default.
    });


    categories.forEach(topic => {
        channels.videoPages[topic].forEach(async (channelUrl) => {
            // for each channel we go to their video page
            openNewPageToUrl(browser, channelUrl).then(async (page) => {

                // set viewport to be set equivalent to the screen size roughly offset to the margins of the chrome browser + bottom toolbar
                let screenSize = await page.evaluate(() => {
                    return {
                        width: window.screen.width,
                        height: window.screen.height
                    };
                })
                await page.setViewport({ width: screenSize.width - 5, height: screenSize.height - 160 });

                let recentVideoCount = await page.evaluate(() => {
                    // we then check for recent videos
                    let recentVideos = Array.from(document.querySelectorAll('#metadata-line'))
                        .filter(thumbNail => thumbNail.textContent.includes('minute') || thumbNail.textContent.includes('hour') || thumbNail.textContent.includes('day ago'));
                    // if there are any, we click the link to the first one and return the total amount of recent videos
                    if (recentVideos.length > 0) {
                        recentVideos[0].click();
                    }
                    return recentVideos.length;
                });
                // if there is more than one new video, we go and open that channel again, and click the links on the rest of the videos
                // this is pretty inefficient and annoying, but for now, it does the job. improve this later by figuring out how to 'open in new tab'
                if (recentVideoCount > 1) {
                    for (let i = 1; i < recentVideoCount; i++) {
                        let newPage = await openNewPageToUrl(browser, channelUrl);

                        // set viewport to be set equivalent to the screen size roughly offset to the margins of the chrome browser + bottom toolbar
                        let screenSize = await page.evaluate(() => {
                            return {
                                width: window.screen.width,
                                height: window.screen.height
                            };
                        })
                        await page.setViewport({ width: screenSize.width - 5, height: screenSize.height - 160 });

                        newPage.evaluate((i) => {
                            let recentVideos = Array.from(document.querySelectorAll('#metadata-line'))
                                .filter(thumbNail => thumbNail.textContent.includes('hours') || thumbNail.textContent.includes('day ago'));

                            recentVideos[i].click();
                        }, i);

                    }
                } else if (recentVideoCount == 0) {
                    page.close();
                }
            })
        })
    })
}



async function openNewPageToUrl(browser, urlString) {
    const page = await browser.newPage();

    await page.goto(urlString, {
        waitUntil: 'networkidle0' // 'networkidle0' is very useful for SPAs.
    });

    await page.setViewport({ width: 1920, height: 920 });

    return page;
}

openAllVideos(process.argv.slice(2));