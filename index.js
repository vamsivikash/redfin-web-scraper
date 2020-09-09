const axios = require('axios');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const { removeListener } = require('process');


const SEARCH_BOX = '#search-box-input';
const SEARCH_INPUT = '98005';
const SEARCH_BUTTON = '.SearchButton';

const FILTER_BUTTON = '.wideSidepaneFilterButton';
const MIN = '.minBeds';
const BASE_URL = "https://redfin.com";

function scrapeContent(scrapeData){
    //console.log(scrapeData);
    fs.writeFile("output/test.txt", scrapeData, function(err){
        if(err)
            console.log("ERROR writing the file ", err)
        else
            console.log('Raw Data written to file');
    });

    const $ = cheerio.load(scrapeData);
    let houseList = $('div.homecards')[0].children;
    let houseDetailsList = [];

    houseList.forEach((house, index, array) => {
        if(index != array.length - 1){
            // item holds the information about each of the search listings - holds both the image + the price (.bottomv2)
            let item = cheerio.load(house.children[0].children); 
            let price = item('.bottomV2 > .homecardV2Price').text();
            let address = item('.bottomV2 > .homeAddressV2').text(); 
            let link = BASE_URL + item('.bottomV2 > a')[0].attribs.href;
            let details = {
                "price": price,
                "address": address, 
                "link": link
            };
            houseDetailsList.push(details);
        }
    });

    return new Promise((resolve, reject) => {
        resolve(houseDetailsList);
    });
}

function parseHomeFacts(homeDetails){
    let details = {};
    const $ = cheerio.load(homeDetails);
    let test = $('div.keyDetailsList');
    //let test = $('div.keyDetailsList')[1].children;
    // test holds the 8 home fact fields 
    console.log("########", test);
    return new Promise((resolve, reject) => {
        resolve(details);
    });
}



async function main(){

    await puppeteer.launch({ headless: true })
        .then(async(browser) => {
            let page = await browser.newPage(); 
            page.setViewport({width: 1386, height: 768});
            await page.goto('https://www.redfin.com/zipcode/98005/filter/max-price=5M,min-beds=5,max-beds=5,min-baths=5', {waitUntil: 'domcontentloaded'});

            // await page.click(FILTER_BUTTON);
            // await page.select('span.minBeds')
            // await page.keyboard.type()
            // await page.keyboard.type(SEARCH_INPUT);
            // await page.click(SEARCH_BUTTON);
            // await page.waitForNavigation({ waitUntil: 'load' })
            const content = await page.content();
            let housesInfoList = await scrapeContent(content);
            //console.log("####", housesInfoList.length);

            housesInfoList.forEach(async(house, index) => {
                let houseDetailsPage = await browser.newPage(); 
                await houseDetailsPage.goto(housesInfoList[index].link, {waitUntil: 'domcontentloaded'});
                const houseCont = await houseDetailsPage.content(); 
                await parseHomeFacts(houseCont);
            });

            
            setTimeout(async() => {
                await browser.close();
           }, 3000);

        });


//    const browser = await puppeteer.launch({
//        headless: true
//    });
   
//    const page = await browser.newPage(); 
//    await page.goto('https://redfin.com', {waitUntil: 'domcontentloaded'});
//    await page.click(SEARCH_BOX); 
//    await page.keyboard.type(SEARCH_INPUT);
//    await page.click(SEARCH_BUTTON);


//    const content = await page.content(); 
//    await scrapeContent(content);

}

main();