const { Builder, By, Key, until } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
require("dotenv").config();

async function loginLinkedIn() {
    let chromeOptions = new Options();
    // chromeOptions.addArguments('--headless'); 
    // chromeOptions.addArguments('--disable-gpu'); 
    chromeOptions.addArguments('--window-size=1920,1080');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    let profilesConnected = [];

    try {
        await driver.get('https://www.linkedin.com/login');
        await driver.findElement(By.id('username')).sendKeys('');  // nome de usuario 
        await driver.findElement(By.id('password')).sendKeys('', Key.RETURN); // senha

        let baseURL = `` // colocar URL com o filtro do linkeidn
        for (let i = 1; i <= 45; i++) {
            await driver.get(`${baseURL}&page=${i}`);
            await driver.sleep(3000);

            let userList = await driver.wait(until.elementLocated(By.css('ul.reusable-search__entity-result-list')), 10000);
            let buttons = await userList.findElements(By.tagName('button'));

            for (let button of buttons) {
                let buttonText = await button.getText();
                if (buttonText.includes('Conectar')) {
                    try {
                        await driver.executeScript("arguments[0].scrollIntoView(true);", button);
                        await driver.sleep(500); 
                        await driver.executeScript("arguments[0].click();", button);
                        await driver.sleep(1000);

                        let sendWithoutNoteButton = await driver.wait(until.elementLocated(By.css("button[aria-label='Enviar sem nota']")), 5000);
                        await sendWithoutNoteButton.click();
                        await driver.sleep(2000);
                    } catch (clickError) {
                        console.error('Erro no clique: ', clickError);
                        continue;
                    }

                    let nameElement = await button.findElement(By.xpath('../../../../../..//span[contains(@class, "entity-result__title-text")]//a'));
                    let name = await nameElement.getText();
                    let profileLink = await nameElement.getAttribute('href');
                    let jobElement = await button.findElement(By.xpath('../../../../../..//div[contains(@class, "entity-result__primary-subtitle")]'));
                    let job = await jobElement.getText();

                    profilesConnected.push({name, job, profileLink});
                }
            }
        }
    } catch (error) {
        console.error('Erro encontrado:', error);
    } finally {
        
        const timestamp = new Date().toISOString().replace(/[:\-]/g, '').replace(/\..+/, '');
        const filePath = `Candidatos_${timestamp}.csv`;
        
        const csvWriter = createCsvWriter({
            path: filePath,
            header: [
                {id: 'name', title: 'Nome'},
                {id: 'job', title: 'Cargo'},
                {id: 'profileLink', title: 'Link do perfil'}
            ]
        });

        await csvWriter.writeRecords(profilesConnected).then(() => {
            console.log('CSV file has been saved.');
        }).catch(err => {
            console.error('Failed to save CSV file:', err);
        });

        await driver.quit();
    }
}

loginLinkedIn();
