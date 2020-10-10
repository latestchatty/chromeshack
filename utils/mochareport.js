/* eslint-disable */
const cypress = require("cypress");
const fse = require("fs-extra");
const { merge } = require("mochawesome-merge");
const generator = require("mochawesome-report-generator");

async function runTests() {
    await fse.remove("mochawesome-report");
    const { totalFailed } = await cypress.run({ browser: "chrome" });
    const jsonReport = await merge();
    await generator.create(jsonReport, { inline: true });
    process.exit(totalFailed);
}

runTests();
