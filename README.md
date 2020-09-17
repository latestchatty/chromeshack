# Chrome Shack

Collection of scripts for the [Shacknews Chatty](https://www.shacknews.com/chatty).

Links:

-   [Chrome Shack website](http://adam.hughes.cc/shack/chromeshack/)
-   [Install Chrome Shack in Chrome](https://chrome.google.com/webstore/detail/chrome-shack/mcnpepegfcikofcogenpncheiohblnpp?hl=en)
-   [Install Chrome Shack in Firefox](https://addons.mozilla.org/en-US/firefox/addon/chromeshack/)

## How to build

NodeJS 12.x+ and NPM 6.x+ are required. Use `npm install` for dependencies.

-   Development mode (`npm run build:dev`) includes full source mapping, and runs an extension reloader plugin through webpack that will reload Chrome/Firefox when files are changed. If you wish to test via a disposable Firefox profile then use `npm run webext` separate from `npm run build:dev`.

-   Production code is generated in the `dist/` folder by running `npm run build:prod`.

-   Deployment packages can be generated with `npm run build:pack`. This results in two uploadable archives: one for code review, and one as a minified bundle, found in the `artifacts/` folder.

#### Dependencies used in this project

NOTE: See the `ThirdPartyLicenses.txt` in the `dist/` folder that is generated when `npm run build:prod` is used for licensing information.

-   [Embla](https://github.com/davidcetinkaya/embla-carousel)
-   [jQuery](https://github.com/jquery/jquery)
-   [DOMPurify](https://github.com/cure53/DOMPurify)
-   [WebExtension-Polyfill](https://github.com/mozilla/webextension-polyfill)
-   [React](https://github.com/facebook/react)
-   [ts-debounce](https://github.com/chodorowicz/ts-debounce)
-   [react-fontawesome](https://github.com/FortAwesome/react-fontawesome)
-   [text-field-edit](https://github.com/fregante/text-field-edit)
