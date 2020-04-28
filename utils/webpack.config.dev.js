/* eslint-disable */
const common = require("./webpack.common");
const merge = require("webpack-merge");
const HappyPack = require("happypack");
const ExtensionReloader = require("webpack-extension-reloader");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = merge(common, {
    stats: "errors-only",
    mode: "development",
    devtool: "inline-source-map",
    watch: true,

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "happypack/loader?id=ts",
            },
        ],
    },

    plugins: [
        new HappyPack({
            id: "ts",
            loaders: [
                { loader: "cache-loader" },
                {
                    path: "ts-loader",
                    query: {
                        transpileOnly: true,
                        experimentalWatchApi: true,
                        happyPackMode: true,
                    },
                },
            ],
        }),
        new ForkTsCheckerWebpackPlugin({
            useTypescriptIncrementalApi: true,
            checkSyntacticErrors: true,
            silent: true,
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
