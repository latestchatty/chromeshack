/* eslint-disable */
const path = require("path");
const fs = require("fs");
const util = require("util");

const archiver = require("archiver");
const archive = archiver("zip");

const readdir = util.promisify(fs.readdir);
const dirExists = async (dir) => await readdir(dir);

const zipDir = path.resolve(__dirname, "../artifacts");
const zipName = "chromeshack-src.zip";
const zipPath = path.resolve(zipDir, zipName);

dirExists(zipDir)
    .then(() => {
        const output = fs.createWriteStream(zipPath);
        output.on("close", () => {
            console.log(`${zipName} finished packing: ${archive.pointer()} bytes`);
        });

        archive.on("warning", console.log);
        archive.on("error", console.log);
        archive.pipe(output);
        archive.glob(`**/*`, {
            ignore: [
                "cypress/fixtures/_shack_li_.txt",
                "node_modules/**",
                ".git/**",
                "dist/**",
                "artifacts/**",
                "mochawesome-report/**",
                "dist.pem",
            ],
        });
        archive.finalize();
    })
    .catch((e) => console.log(`${zipDir} not found!`));
