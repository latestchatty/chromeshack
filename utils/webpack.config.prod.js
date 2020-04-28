/* eslint-disable */
const common = require("./webpack.common");
const merge = require("webpack-merge");
const HappyPack = require("happypack");
const TerserPlugin = require("terser-webpack-plugin");
const LicenseCheckerWebpackPlugin = require("license-checker-webpack-plugin");

module.exports = merge(common, {
    mode: "production",
    devtool: false,
    performance: { hints: false },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "happypack/loader?id=ts",
            },
        ],
    },

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_fnames: true,
                    mangle: { reserved: ["jQuery", "$"] },
                    output: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
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
                        happyPackMode: true,
                    },
                },
            ],
        }),
        new LicenseCheckerWebpackPlugin({
            outputFilename: "ThirdPartyLicenses.txt",
            allow: "(Apache-2.0 OR BSD-2-Clause OR BSD-3-Clause OR MIT OR MPL-2.0)",
        }),
    ],
});
