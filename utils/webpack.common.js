/* eslint-disable */
const webpack = require("webpack");
const path = require("path");
const FileManagerPlugin = require("filemanager-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const rootDir = path.resolve(__dirname, "..");
const dist = path.resolve(rootDir, "./dist");
const distImages = path.resolve(dist, "./images");
const workspace = path.resolve(rootDir, "./src");
const assets = path.resolve(workspace, "./assets");
const assetImages = path.resolve(assets, "./images");

module.exports = {
    stats: "minimal",

    context: path.resolve(__dirname, ".."),

    entry: {
        content: "./src/content.ts",
        background: "./src/background.ts",
        popup: "./src/popup.ts",
    },

    output: {
        path: dist,
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
        new ForkTsCheckerWebpackPlugin({
            formatter: "basic",
            eslint: {
                enabled: true,
                files: "./src/**/*.{ts,tsx}",
            },
        }),
        new webpack.DefinePlugin({
            __REACT_DEVTOOLS_GLOBAL_HOOK__: "({ isDisabled: true })",
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css",
        }),
        new FileManagerPlugin({
            onEnd: [
                {
                    copy: [
                        { source: path.resolve(workspace, "popup.html"), destination: dist },
                        { source: path.resolve(assets, "release_notes.html"), destination: dist },
                        { source: path.resolve(assets, "manifest.json"), destination: dist },
                        { source: path.resolve(rootDir, "*.md"), destination: dist },
                        { source: assetImages, destination: distImages },
                    ],
                },
            ],
        }),
    ],
};
