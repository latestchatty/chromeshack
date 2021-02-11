/* eslint-disable */
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const { paths } = require("./webpack.globals");

module.exports = {
    stats: "minimal",

    context: path.resolve(__dirname, ".."),

    entry: {
        content: "./src/content.ts",
        background: "./src/background.ts",
        popup: "./src/popup.tsx",
    },

    optimization: {
        splitChunks: {
            automaticNameDelimiter: "-",
            chunks: "all",
        },
    },

    output: {
        path: paths.dist,
        filename: "[name].js",
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    transpileOnly: true,
                },
            },
        ],
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css",
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(paths.assets, "popup.html"), to: paths.dist },
                { from: path.resolve(paths.assets, "release_notes.html"), to: paths.dist },
                { from: paths.assetImages, to: paths.distImages },
            ],
        }),
        new ForkTsCheckerWebpackPlugin({
            formatter: "basic",
            eslint: {
                files: "./src/**/*.{ts,tsx}",
            },
        }),
    ],
};
