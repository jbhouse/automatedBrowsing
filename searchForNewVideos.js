var channels = require('./YoutubeChannelList')
const puppeteer = require('puppeteer');
var fs = require('fs');
var previouslyViewedVideos = require('./searchForNewVideos.json')

async function openAllVideos(categories) {
    const browser = await puppeteer.launch({
        headless: false, args: ['--start-maximized'] // Puppeteer is 'headless' by default.
    });

    categories.forEach(topic => {
        channels.videoPages[topic].forEach(async (channelUrl) => {
            // add channel to its respective topic in the previously viewed list if it is not already present
            if (undefined == previouslyViewedVideos[topic]) {
                previouslyViewedVideos[topic] = {};
            }
            if (undefined == previouslyViewedVideos[topic][channelUrl]) {
                previouslyViewedVideos[topic][channelUrl] = [];
            }

            // for each channel we go to their video page
            openNewPageToUrl(browser, channelUrl).then(async (page) => {

                let recentUnviewedVideoTitles = await page.evaluate((previouslyViewedVideos, topic, channelUrl) => {
                    // we then check for recent videos
                    let recentVideos = Array.from(document.querySelectorAll('#metadata-line'))
                        .filter(thumbNail => thumbNail.textContent.includes('minute') || thumbNail.textContent.includes('hour') || thumbNail.textContent.includes('day ago'));
                    // if there are any, we click the link to the first one and return the total amount of recent videos
                    let recentVideoCount = recentVideos.length;
                    let totalSkipped = 0;
                    let titles = [];
                    Array.from(document.querySelectorAll('#video-title'))
                        .slice(0, recentVideoCount)
                        .map(element => element.textContent)
                        .forEach(element => {
                            if (previouslyViewedVideos[topic][channelUrl].includes(element)) {
                                if (recentVideoCount > 0) {
                                    recentVideoCount--;
                                }
                                totalSkipped++;
                            }
                            titles.push(element)
                        });
                    if (recentVideoCount > 0) {
                        recentVideos[0].click();
                    }
                    return {
                        videosTitles: titles.slice(0, recentVideoCount),
                        videosSkipped: totalSkipped,
                        url: channelUrl
                    }
                }, previouslyViewedVideos, topic, channelUrl);

                if (recentUnviewedVideoTitles.videosTitles.length > 0) {

                    await page.goto(page.url().split('youtube')[0] + "youtubepp" + page.url().split('youtube')[1], {
                        waitUntil: 'networkidle0'
                    });

                    let downloadButtonSelector = '#mainBox > div.main-result.bg-grey > div > div.c-result__content > div:nth-child(2) > table > tbody > tr:nth-child(1) > td.txt-center > a';
                    let downloadConfirmSelector = '#process-result > div > a';

                    navigateDownloadPage(page, downloadButtonSelector, downloadConfirmSelector).catch(async (err) => {
                        navigateDownloadPage(page, downloadButtonSelector, downloadConfirmSelector).catch(async (err) => {
                            navigateDownloadPage(newPage, downloadButtonSelector, downloadConfirmSelector)
                        })
                    })

                }
                // remove filter values that belong to videos too old to be selected from
                previouslyViewedVideos[topic][channelUrl] = previouslyViewedVideos[topic][channelUrl].slice(previouslyViewedVideos[topic][channelUrl].length - recentUnviewedVideoTitles.videosSkipped, previouslyViewedVideos[topic][channelUrl].length);

                recentUnviewedVideoTitles.videosTitles.forEach(element => {
                    previouslyViewedVideos[topic][channelUrl].push(element);
                });

                fs.writeFileSync(process.argv[1] + 'on', JSON.stringify(previouslyViewedVideos, null, 2));

                // if there is more than one new video, we go and open that channel again, and click the links on the rest of the videos
                // this is pretty inefficient and annoying, but for now, it does the job. improve this later by figuring out how to 'open in new tab'
                if (recentUnviewedVideoTitles.videosTitles.length > 1) {
                    for (let i = 1; i < recentUnviewedVideoTitles.videosTitles.length; i++) {
                        let newPage = await openNewPageToUrl(browser, channelUrl);

                        await newPage.evaluate((i) => {
                            let recentVideos = Array.from(document.querySelectorAll('#metadata-line'))
                                .filter(thumbNail => thumbNail.textContent.includes('hours') || thumbNail.textContent.includes('day ago'));

                            recentVideos[i].click();
                        }, i);

                        await newPage.goto(newPage.url().split('youtube')[0] + "youtubepp" + newPage.url().split('youtube')[1], {
                            waitUntil: 'networkidle0'
                        });

                        let downloadButtonSelector = '#mainBox > div.main-result.bg-grey > div > div.c-result__content > div:nth-child(2) > table > tbody > tr:nth-child(1) > td.txt-center > a';
                        let downloadConfirmSelector = '#process-result > div > a';

                        navigateDownloadPage(newPage, downloadButtonSelector, downloadConfirmSelector).catch(async (err) => {
                            navigateDownloadPage(newPage, downloadButtonSelector, downloadConfirmSelector).catch(async (err) => {
                                navigateDownloadPage(newPage, downloadButtonSelector, downloadConfirmSelector)
                            })
                        })

                    }
                } else if (recentUnviewedVideoTitles.videosTitles.length == 0) {
                    page.close()
                }
            })
        })
    })
}

async function navigateDownloadPage(page, downloadButtonSelector, downloadConfirmSelector) {
    await page.waitForSelector(downloadButtonSelector)
    await page.evaluate((selector) => {
        document.querySelector(selector).click();
    }, downloadButtonSelector);

    await page.waitForSelector(downloadConfirmSelector);
    await page.evaluate((selector) => {
        document.querySelector(selector).click();
    }, downloadConfirmSelector);
}

async function openNewPageToUrl(browser, urlString) {
    const page = await browser.newPage();

    await page.goto(urlString, {
        waitUntil: 'networkidle0' // 'networkidle0' is very useful for SPAs.
    });

    return page;
}

openAllVideos(process.argv.slice(2));
