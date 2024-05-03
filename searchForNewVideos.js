var channels = require('./searchForNewVideos.json');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
var fs = require('fs');

async function openAllVideos() {
    const browser = await puppeteer.launch({
        headless: true//, args: ['--start-maximized'] // Puppeteer is 'headless' by default.
    });

    const currentCreators = channels.creators.filter(channel => process.argv.includes(channel.channelName))

    for(i = 0; i < currentCreators.length; i++) {
        let creator = currentCreators[i];
        await openNewPageToUrl(browser, creator.channelUrl)
        .then(async page => {
            await page.waitForSelector('#video-title-link');
            let videosToDownload = await page.evaluate(async (creator) => {
                return Array.from(document.querySelectorAll('#video-title-link'))
                    .filter(video => !creator.videos.includes(video.href))
                    .map(vid => ({
                        title: vid.innerText,
                        link: vid.href
                    }));
            }, creator)
            videosToDownload.forEach(async vid => {
                console.log(`downloading video: '${vid.title}' for creator: '${creator.channelName}'`);
                exec(`mkdir -p ~/Documents/videos/${creator.channelName} && cd ~/Documents/videos/${creator.channelName} && youtube-dl -f 140 ${vid.link}`, (err, stdout, stderr) => {
                    if (err) {
                        console.log("--------------");
                        console.log(`mkdir -p ~/Documents/videos/${creator.channelName} && cd ~/Documents/videos/${creator.channelName} && youtube-dl -f 140 ${vid.link}`);
                        console.log("--------------");
                        console.log(`err: ${err}`)
                        return;
                    } else {
                        console.log(`stderr: ${stderr}`)
                        console.log(`${stdout}`);
                        console.log("==================");
                        console.log(`downloaded ${vid.title}`);
                        console.log("==================");
                        console.log(`from link ${vid.link}`);
                        console.log("==================");
                        creator.videos.push(vid.link);
                        fs.writeFileSync(process.argv[1] + 'on', JSON.stringify(channels, null, 2));
                    }
                  });
            })
        })
        .catch(exception => {
            console.log(`creator: ${creator} had exception ${exception}`);
        })
    }
    
}

async function openNewPageToUrl(browser, urlString) {
    const page = await browser.newPage();

    await page.goto(urlString, {
        waitUntil: 'networkidle0' // 'networkidle0' is very useful for SPAs.
    });

    return page;
}

openAllVideos();
