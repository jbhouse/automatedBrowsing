var channels = require('./YoutubeChannelList')
const puppeteer = require('puppeteer');
var fs = require('fs');
var previouslyViewedVideos = require('./previouslyViewed.json')

async function openAllVideos(categories) {
    const browser = await puppeteer.launch({
        headless: false, args: ['--start-maximized'] // Puppeteer is 'headless' by default.
    });

    categories.forEach(topic => {
        channels.videoPages[topic].forEach(async (channelUrl) => {
            // for each channel we go to their video page
            openNewPageToUrl(browser, channelUrl).then(async (page) => {

                let idk = [];
                // set viewport to be set equivalent to the screen size roughly offset to the margins of the chrome browser + bottom toolbar
                let screenSize = await page.evaluate(() => {
                    return {
                        width: window.screen.width,
                        height: window.screen.height
                    };
                })
                await page.setViewport({ width: screenSize.width, height: screenSize.height - 10 });

                let recentUnviewedVideoTitles = await page.evaluate((previouslyViewedVideos, topic) => {
                    // we then check for recent videos
                    let recentVideos = Array.from(document.querySelectorAll('#metadata-line'))
                        .filter(thumbNail => thumbNail.textContent.includes('minute') || thumbNail.textContent.includes('hour') || thumbNail.textContent.includes('day ago'));
                    // if there are any, we click the link to the first one and return the total amount of recent videos
                    let recentVideoCount = recentVideos.length;
                    let titles = [];
                    Array.from(document.querySelectorAll('#video-title'))
                        .map(element => element.textContent)
                        .forEach(element => {
                            if (previouslyViewedVideos[topic].includes(element)) {
                                recentVideoCount--;
                            }
                            titles.push(element)
                        });
                    if (recentVideoCount > 0) {
                        recentVideos[0].click();
                    }
                    return titles.slice(0, recentVideoCount)
                }, previouslyViewedVideos, topic);

                console.log(recentUnviewedVideoTitles);
                recentUnviewedVideoTitles.forEach(element => {
                    previouslyViewedVideos[topic].push(element);
                });

                // previouslyViewedVideos[topic].push(recentUnviewedVideoTitles);

                fs.writeFileSync('./previouslyViewed.json', JSON.stringify(previouslyViewedVideos, null, 2));

                // if there is more than one new video, we go and open that channel again, and click the links on the rest of the videos
                // this is pretty inefficient and annoying, but for now, it does the job. improve this later by figuring out how to 'open in new tab'
                if (recentUnviewedVideoTitles.length > 1) {
                    for (let i = 1; i < recentUnviewedVideoTitles.length; i++) {
                        let newPage = await openNewPageToUrl(browser, channelUrl);

                        // set viewport to be set equivalent to the screen size roughly offset to the margins of the chrome browser + bottom toolbar
                        let screenSize = await page.evaluate(() => {
                            return {
                                width: window.screen.width,
                                height: window.screen.height
                            };
                        })
                        await page.setViewport({ width: screenSize.width - 5, height: screenSize.height - 30 });

                        newPage.evaluate((i) => {
                            let recentVideos = Array.from(document.querySelectorAll('#metadata-line'))
                                .filter(thumbNail => thumbNail.textContent.includes('hours') || thumbNail.textContent.includes('day ago'));

                            recentVideos[i].click();
                        }, i);

                    }
                } else if (recentUnviewedVideoTitles.length == 0) {
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

// fs.writeFileSync('./previouslyViewed.json', JSON.stringify(page.url(), null, 2));
// newlyViewedVideos.push(newPage.urlString())