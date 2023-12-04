var channels = require('./YoutubeChannelList.json');
const puppeteer = require('puppeteer');
var fs = require('fs');

async function openAllVideos() {
    const browser = await puppeteer.launch({
        headless: true//, args: ['--start-maximized'] // Puppeteer is 'headless' by default.
    });

    channels.creators.forEach(creator => {
       
        openNewPageToUrl(browser, creator.channelUrl)
        .then(async page => {
            await page.waitForSelector('#video-title-link');
            let videosToDownload = await page.evaluate(async (creator) => {
                return Array.from(document.querySelectorAll('#video-title-link'))
                    .filter(video => !creator.videos.includes(video.innerText))
                    .map(vid => ({
                        title: vid.innerText,
                        link: vid.href
                    }));
            }, creator)
            console.log(videosToDownload);
        })
        .catch(exception => {
            console.log(exception);
        })
    })
    
}

async function openNewPageToUrl(browser, urlString) {
    const page = await browser.newPage();

    await page.goto(urlString, {
        waitUntil: 'networkidle0' // 'networkidle0' is very useful for SPAs.
    });

    return page;
}

openAllVideos();
