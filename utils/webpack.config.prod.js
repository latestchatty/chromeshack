/* eslint-disable */
const common = require("./webpack.common");
const { merge } = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
const LicenseCheckerWebpackPlugin = require("license-checker-webpack-plugin");

module.exports = merge(common, {
    mode: "production",
    devtool: false,
    performance: { hints: false },

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: false,
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
        new LicenseCheckerWebpackPlugin({
            outputFilename: "ThirdPartyLicenses.txt",
            allow: "(Apache-2.0 OR BSD-2-Clause OR BSD-3-Clause OR MIT OR MPL-2.0 OR Zlib)",
        }),
    ],
});
