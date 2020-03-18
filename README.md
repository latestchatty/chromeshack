# Chrome Shack

Collection of scripts for the [Shacknews Chatty](https://www.shacknews.com/chatty).

Links:

-   [Chrome Shack website](http://adam.hughes.cc/shack/chromeshack/)
-   [Install Chrome Shack in Chrome](https://chrome.google.com/webstore/detail/chrome-shack/mcnpepegfcikofcogenpncheiohblnpp?hl=en)
-   [Install Chrome Shack in Firefox](https://addons.mozilla.org/en-US/firefox/addon/chromeshack/)

## How to build

NodeJS 12.x+ is required, then just use `npm install`. The following scripts are provided for ease of maintenance:

-   `npm run build:dev` for auto-reloading the extension in Chrome/Firefox in dev mode
-   `npm run build:prod` for building in production mode (for both Firefox and Chrome)
-   `npm run webext` for testing the extension in Firefox via `web-ext run`
-   `npm run lint` for running the AMO linter to audit production code
-   `npm run sign` for packing `dist/` into an XPI for upload to AMO

#### Dependencies used in this project

-   [jQuery](https://github.com/jquery/jquery)
-   [DOMPurify](https://github.com/cure53/DOMPurify)
-   [Luxon](https://github.com/moment/luxon)
-   [WebExtension-Polyfill](https://github.com/mozilla/webextension-polyfill)
