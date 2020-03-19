/* eslint-disable */
const common = require("./webpack.common");
const merge = require("webpack-merge");
const ExtensionReloader = require("webpack-extension-reloader");

module.exports = merge(common, {
    mode: "development",
    devtool: "inline-source-map",

    plugins: [
        new ExtensionReloader({
            port: 9090,
            reloadPage: true,
            entries: {
                contentScript: "content",
                background: "background",
                extensionPage: "popup",
            },
        }),
    ],
});
