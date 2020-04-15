/* eslint-disable */
const common = require("./webpack.common");
const TerserPlugin = require("terser-webpack-plugin");
const merge = require("webpack-merge");

module.exports = merge(common, {
    mode: "production",
    devtool: false,
    performance: { hints: false },

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
});
