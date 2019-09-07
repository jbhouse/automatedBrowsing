var channels = require('./YoutubeChannelList')
const puppeteer = require('puppeteer');
// let fs = require('fs');

(async () => {
    // OPTION 1 - Launch new.
    const browser = await puppeteer.launch({
        headless: false // Puppeteer is 'headless' by default.
    });

    const page = await browser.newPage();
    // let pageUrl = 'https://www.youtube.com/user/Techquickie/videos';
    let pageUrl = 'https://www.youtube.com/channel/UCcefcZRL2oaA_uBNeo5UOWg/videos';

    await page.goto(pageUrl, {
        waitUntil: 'networkidle0' // 'networkidle0' is very useful for SPAs.
    });

    page.evaluate(() => {
        const tds = Array.from(document.querySelectorAll('#metadata-line'));
        // tds.filter(td => td.textContent.split('views')[1].includes('hours') || td.textContent.split('views')[1].includes('day ago'))[0].click();
        // tds.filter(td => td.textContent.split('views')[1].includes('hours') || td.textContent.split('views')[1].includes('day ago')).forEach(newVideo => {
        //     newVideo.click()
        // })
        return tds
            .filter(
                td => td.textContent.split('views')[1].includes('hours') ||
                    td.textContent.split('views')[1].includes('day ago'))
            .map(td => td.textContent)
    }).then(idk => {
        console.log("yes");
        console.log(idk);
        // likely need to find a way to take the relevant textContent and open a new page for each video
    });



    // Object.keys(channels.videoPages).forEach(topic => {
    //     let allChannelsInCategoryArray = channels.videoPages[topic]
    //     allChannelsInCategoryArray.forEach(async (channelUrl) => {
    //         let page = await browser.newPage();
    //         let pageUrl = channelUrl;

    //         await page.goto(pageUrl, {
    //             waitUntil: 'networkidle0' // 'networkidle0' is very useful for SPAs.
    //         });
    //     })
    // })




    // let mostSearchedList = await page.evaluate(() => {
    //     let objectList = document.querySelectorAll('.js-most-searched .home__list-item');
    //     let mostSearched = [];

    //     objectList.forEach((item) => {
    //         let child = item.firstChild;
    //         let title = child.innerText;
    //         let href = child.href;

    //         mostSearched.push(title + ' - ' + href);
    //     });

    //     return mostSearched;
    // });

    // fs.writeFile("mostSearched.txt", mostSearchedList, function (err) {
    //     if (err) {
    //         return console.log(err);
    //     }

    //     console.log("The file was saved!");
    // });
})();