# Chrome Shack

Collection of scripts for the [Shacknews Chatty](https://www.shacknews.com/chatty).

Links:

-   [Chrome Shack website](http://adam.hughes.cc/shack/chromeshack/)
-   [Install Chrome Shack in Chrome](https://chrome.google.com/webstore/detail/chrome-shack/mcnpepegfcikofcogenpncheiohblnpp?hl=en)
-   [Install Chrome Shack in Firefox](https://addons.mozilla.org/en-US/firefox/addon/chromeshack/)

## How to build

NodeJS 12.x+ and NPM 6.x+ are required. Use `npm install` for dependencies.

-   Development mode (`npm run build:dev`) includes full source mapping, and runs an extension reloader plugin through webpack that will reload Chrome/Firefox when files are changed. If you wish to test via a disposable Firefox profile then use `npm run webext` separate from `npm run build:dev`.

-   Production code is generated in the `dist/` folder by running `npm run build:prod`, along with two zip files in the `artifacts/` folder that are deployment ready (not signed).

NPM commands are as follows:

-   `npm run build:dev` for auto-reloading the extension in Chrome/Firefox in dev mode
-   `npm run build:prod` for building in production mode (for both Firefox and Chrome)
-   `npm run pack` for packing the raw extension source for upload to AMO for admin review
-   `npm run lint` for running auto-fix linting through ESLint and Prettier
-   `npm run extlint` for running the AMO linter to audit production code
-   `npm run webext` for testing the extension in a clean Firefox profile via `web-ext run`
-   `npm run sign` for packing `dist/` into a self-signed XPI for upload to AMO
-   `npm run zip` for packing `dist/` for uploading to AMO or Chrome Store

#### Dependencies used in this project

NOTE: See the `ThirdPartyLicenses.txt` in the `dist/` folder that is generated when `npm run build:prod` is used for licensing information.

-   [jQuery](https://github.com/jquery/jquery)
-   [DOMPurify](https://github.com/cure53/DOMPurify)
-   [Luxon](https://github.com/moment/luxon)
-   [WebExtension-Polyfill](https://github.com/mozilla/webextension-polyfill)
-   [React](https://github.com/facebook/react)
-   [ts-debounce](https://github.com/chodorowicz/ts-debounce)
