var channels = require('./searchForNewVideos.json');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
var fs = require('fs');

async function openAllVideos() {
    const browser = await puppeteer.launch({
        headless: true//, args: ['--start-maximized'] // Puppeteer is 'headless' by default.
    });

    for(i = 0; i < channels.creators.length; i++) {
        let creator = channels.creators[i];
        await openNewPageToUrl(browser, creator.channelUrl)
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
            videosToDownload.forEach(async vid => {
                console.log(`downloading video: '${vid.title}' for creator: '${creator.channelName}'`)
                exec(`mkdir -p ~/Documents/videos/${creator.channelName} && cd ~/Documents/videos/${creator.channelName} && youtube-dl ${vid.link}`, (err, stdout, stderr) => {
                    if (err) {
                      console.log(`err: ${err}`)
                      return;
                    } else {
                        console.log(`stdout: ${stdout}`);
                        console.log(`stderr: ${stderr}`);
                        creator.videos.push(vid.title);
                    }
                  });
            })
        })
        .catch(exception => {
            console.log(`creator: ${creator} had exception ${exception}`);
        })
        if(i == channels.creators.length - 1) {
            fs.writeFileSync(process.argv[1] + 'on', JSON.stringify(channels, null, 2));
        } 
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
