var filePipe;
const fs = require('fs');
const path = require('path');
const logFilePath = "./erc20generator.log";
const gitIgnoreFilePath = "./.gitignore";
var util = require('util');

async function initLogFile() {
    await removeOldLog();
    checkGitIgnore();
    filePipe = fs.openSync(logFilePath, 'a');
}

async function getFilePipe() {
    if (!filePipe) await initLogFile();
    return filePipe;
}

function checkGitIgnore() {
    const expectedgitIgnogreLine = path.basename(logFilePath);
    if (fs.existsSync(gitIgnoreFilePath)) {
        if (!fs.readFileSync(gitIgnoreFilePath).toString().includes(expectedgitIgnogreLine)) {
            fs.appendFileSync(gitIgnoreFilePath, '\n' + expectedgitIgnogreLine);
        }
    } else {
        fs.writeFileSync(gitIgnoreFilePath, expectedgitIgnogreLine);
    }
}

async function removeOldLog() {
    if (fs.existsSync(logFilePath)) {
        var dateMinus6Month = new Date();
        dateMinus6Month.setMonth(dateMinus6Month.getMonth() - 6);
        const data = await fs.promises.readFile(logFilePath);
        const lines = data.toString().split("\n");
        const regexStartWithIsoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
        const linesWithoutOldTimestamp = [];
        var tooOld = false;
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].match(regexStartWithIsoDate) && !tooOld) {
                linesWithoutOldTimestamp.push(lines[i]);
            }
            if (lines[i].match(regexStartWithIsoDate)) {
                if (new Date(regexStartWithIsoDate.exec(lines[i])).getTime() > dateMinus6Month.getTime()) {
                    linesWithoutOldTimestamp.push(lines[i]);
                    tooOld = false;
                } else {
                    tooOld = true;
                }
            }
        }
        await fs.promises.writeFile(logFilePath, linesWithoutOldTimestamp.join("\n"));
    }
}

async function log(message, message2, message3, message4) {
    const filePipe = await getFilePipe();
    const timestamp = new Date().toISOString();
    const logMessage = timestamp + " : " + message +
        (message2 ? message2 : "") +
        (message3 ? message3 : "") +
        (message4 ? message4 : "") + "\n";
    fs.writeSync(filePipe, logMessage);
}

function overrideConsoleLog() {
    console.log = function (a, b, c, d) { //
        log(util.format(a), b ? util.format(b) : "", c ? util.format(c) : "", d ? util.format(d) : "");
    };
}

module.exports = { initLogFile, getFilePipe, overrideConsoleLog };