/* eslint-disable */
const path = require("path");
const common = require("./webpack.common");
const { merge } = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
const LicenseCheckerWebpackPlugin = require("license-checker-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const { paths, modifyManifestProd } = require("./webpack.globals");

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
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(paths.rootDir, "*.md"),
                    to: paths.dist,
                    from: path.resolve(paths.assets, "manifest.prod.json"),
                    to: path.resolve(paths.dist, "manifest.json"),
                    transform(c) {
                        return modifyManifestProd(c);
                    },
                },
            ],
        }),
        new LicenseCheckerWebpackPlugin({
            outputFilename: "ThirdPartyLicenses.txt",
            allow: "(Apache-2.0 OR BSD-2-Clause OR BSD-3-Clause OR MIT OR MPL-2.0 OR Zlib OR CC-BY-4.0 OR WTFPL)",
        }),
    ],
});
