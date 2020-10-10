/// <reference types="Cypress" />

const fs = require("fs");
const path = require("path");

const { paths } = require("../../utils/webpack.globals");
const extensionLoader = require("cypress-browser-extension-plugin/loader");
const extensionDir = path.resolve(paths.rootDir, "artifacts/cypress-crx");

const fixPaths = (args) => {
    // correct paths to posix format
    const mfPath = path.resolve(extensionDir, "manifest.json");
    const manifest = fs.readFileSync(mfPath).toString();
    const fixedPaths = manifest.replace(/\\\\/gm, "/");
    if (fixedPaths) fs.writeFileSync(mfPath, fixedPaths);
    return args;
};

module.exports = (on) => {
    on("before:browser:launch", (browser = {}, launchOptions) => {
        // NOTE: only Webkit is supported as a test target
        const onBeforeBrowserLaunch = extensionLoader.load({
            source: paths.dist,
            destDir: extensionDir,
            skipHooks: false,
        });
        return onBeforeBrowserLaunch(browser, [...launchOptions.args, "--autoplay-policy=user-gesture-required"])
            .then(function (args) {
                launchOptions.args = args;
                return launchOptions;
            })
            .then(fixPaths);
    });
};
