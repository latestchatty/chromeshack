/* eslint-disable */
const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: {
        content: "./src/app/content.ts",
        background: "./src/app/background.ts",
        popup: "./src/app/popup.ts",
    },

    output: {
        path: path.resolve(__dirname, "../dist"),
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
        ],
    },

    plugins: [
        new webpack.DefinePlugin({
            __REACT_DEVTOOLS_GLOBAL_HOOK__: "({ isDisabled: true })",
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css",
        }),
        new CopyPlugin([
            { from: "./src/images", to: "images" },
            { from: "./src/app/popup.html", to: "." },
            { from: "./src/release_notes.html", to: "." },
            { from: "./src/manifest.json", to: "." },
            { from: "./*.md", to: "." },
        ]),
    ],
};
