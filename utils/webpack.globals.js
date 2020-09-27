/* eslint-disable */
const path = require("path");

const packageJSON = require("../package.json");

const rootDir = path.resolve(__dirname, "..");
const dist = path.resolve(rootDir, "./dist");
const distImages = path.resolve(dist, "./images");
const workspace = path.resolve(rootDir, "./src");
const assets = path.resolve(workspace, "./assets");
const assetImages = path.resolve(assets, "./images");

// used with CopyWebpackPlugin
const transformPkgVer = () => {
    // pull the package version and use it to update our manifest
    const _majorMinorVer = packageJSON.version.replace(
        /(\d+)\.(\d+)(?:\.(\d+))?/gm,
        (_, majVer, minVer, revVer) => `${majVer}.${minVer}${revVer || ""}`,
    );
    return _majorMinorVer || packageJSON.version;
};
const modifyManifestVer = (manifestJSON) => {
    return { ...manifestJSON, version: transformPkgVer() };
};
const modifyManifestDev = (manifestJSON) => {
    return {
        ...manifestJSON,
        content_security_policy: "script-src 'self' http://localhost:8097; object-src 'self'",
    };
};

const modifyManifestChrome = (manifestJSON) => {
    return { ...modifyManifestVer(manifestJSON), update_url: "http://clients2.google.com/service/update2/crx" };
};
const modifyManifestFirefox = (manifestJSON) => {
    return {
        ...modifyManifestVer(manifestJSON),
        browser_specific_settings: {
            gecko: {
                id: "addon@chromeshack.com",
                strict_min_version: "42.0",
            },
        },
    };
};

const modifyManifestDevChrome = (buffer) => {
    const _manifest = buffer && JSON.parse(buffer.toString());
    const mutatedManifest = {
        ...modifyManifestChrome(_manifest),
        ...modifyManifestDev(_manifest),
    };
    // return a formatted JSON file
    return Buffer.from(JSON.stringify(mutatedManifest, null, 2));
};
const modifyManifestDevFirefox = (buffer) => {
    const _manifest = buffer && JSON.parse(buffer.toString());
    const mutatedManifest = {
        ...modifyManifestFirefox(_manifest),
        ...modifyManifestDev(_manifest),
    };
    return Buffer.from(JSON.stringify(mutatedManifest, null, 2));
};
const modifyManifestProd = (buffer) => {
    const _manifest = buffer && JSON.parse(buffer.toString());
    const mutatedManifest = { ...modifyManifestChrome(_manifest) };
    return Buffer.from(JSON.stringify(mutatedManifest, null, 2));
};

module.exports = {
    // made available for other configs (dev/prod)
    paths: {
        rootDir,
        dist,
        distImages,
        workspace,
        assets,
        assetImages,
    },
    modifyManifestDevChrome,
    modifyManifestDevFirefox,
    modifyManifestProd,
};
