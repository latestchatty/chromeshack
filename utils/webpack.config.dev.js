/* eslint-disable */
const path = require("path");
const common = require("./webpack.common");
const { merge } = require("webpack-merge");
const ExtensionReloader = require("webpack-extension-reloader");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const { paths, modifyManifestDevChrome } = require("./webpack.globals");

module.exports = merge(common, {
    mode: "development",
    devtool: "inline-source-map",

    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(paths.assets, "manifest.json"),
                    to: path.resolve(paths.dist, "manifest.json"),
                    transform(c) {
                        return modifyManifestDevChrome(c);
                    },
                },
            ],
        }),
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
