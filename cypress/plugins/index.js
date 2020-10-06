const { paths } = require("../../utils/webpack.globals");
const extensionLoader = require("cypress-browser-extension-plugin/loader");

module.exports = (on) => {
    on("before:browser:launch", (browser = {}, launchOptions) => {
        const onBeforeBrowserLaunch = extensionLoader.load({
            source: paths.dist,
            skipHooks: true,
        });
        var args = [...launchOptions.args, "--autoplay-policy=user-gesture-required"];
        const argsPromise = onBeforeBrowserLaunch(browser, args);
        const launchOptionsPromise = argsPromise.then(function (args) {
            launchOptions.args = args;
            return launchOptions;
        });
        return launchOptionsPromise;
    });
};
