/* eslint-disable */
const path = require("path");
const FileManagerPlugin = require("filemanager-webpack-plugin");
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
        new FileManagerPlugin({
            onEnd: [
                {
                    copy: [
                        { source: path.resolve(paths.assets, "popup.html"), destination: paths.dist },
                        { source: path.resolve(paths.assets, "release_notes.html"), destination: paths.dist },
                        { source: path.resolve(paths.rootDir, "*.md"), destination: paths.dist },
                        { source: paths.assetImages, destination: paths.distImages },
                    ],
                },
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
