var channels = require('./YoutubeChannelList')
const puppeteer = require('puppeteer');
// let fs = require('fs');

(async () => {
    // OPTION 1 - Launch new.
    const browser = await puppeteer.launch({
        headless: false // Puppeteer is 'headless' by default.
    });

    Object.keys(channels.videoPages).forEach(topic => {
        let allChannelsInCategoryArray = channels.videoPages[topic]
        allChannelsInCategoryArray.forEach(async (channelUrl) => {

            // for each channel we go to their video page
            openNewPageToUrl(browser, channelUrl).then(async (page) => {
                let recentVideoCount = await page.evaluate(() => {
                    // we then check for recent videos
                    let recentVideos = Array.from(document.querySelectorAll('#metadata-line'))
                        .filter(thumbNail => thumbNail.textContent.includes('hours') || thumbNail.textContent.includes('day ago'));
                    // if there are any, we click the link to the first one and return the total amount of recent videos
                    if (recentVideos.length > 0) {
                        recentVideos[0].click();
                    }
                    return recentVideos.length;
                });
                // if there is more than one new video, we go and open that channel again, and click the links on the rest of the videos
                // this is pretty inefficient and annoying, but for now, it does the job. improve this later
                if (recentVideoCount > 1) {
                    for (let i = 1; i < recentVideoCount; i++) {
                        let newPage = await openNewPageToUrl(browser, channelUrl);
                        newPage.evaluate((i) => {
                            let recentVideos = Array.from(document.querySelectorAll('#metadata-line'))
                                .filter(thumbNail => thumbNail.textContent.includes('hours') || thumbNail.textContent.includes('day ago'));

                            recentVideos[i].click();
                        }, i);

                    }
                }
            })
        })
    })
})();



async function openNewPageToUrl(browser, urlString) {
    const page = await browser.newPage();

    await page.goto(urlString, {
        waitUntil: 'networkidle0' // 'networkidle0' is very useful for SPAs.
    });

    return page;
}