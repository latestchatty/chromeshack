# Chrome Shack

Collection of scripts for the [Shacknews Chatty](https://www.shacknews.com/chatty).

Links:

- [Chrome Shack website](http://adam.hughes.cc/shack/chromeshack/)
- [Install Chrome Shack in Chrome](https://chrome.google.com/webstore/detail/chrome-shack/mcnpepegfcikofcogenpncheiohblnpp?hl=en)
- [Install Chrome Shack in Firefox](https://addons.mozilla.org/en-US/firefox/addon/chromeshack/)

## How to build

NodeJS 20.x+ and NPM 9.x+ are required, but this is also a PNPM-preferred repo (8.x+ recommended). Use `pnpm i` for installing dependencies.

- (`pnpm dev` or `npm run dev`) includes full source mapping and a WebKit/Firefox manifest in the `dist/` and `dist-firefox/` folders respectively.

- (`pnpm build` or `npm run build`) builds production code for WebKit/Firefox manifest in the `dist/` and `dist-firefox/` folders respectively.

- (`pnpm build:pkg` or `npm run build:pkg`) builds production code for WebKit/Firefox and places zipped archives in `artifacts/` for upload to AMO and CWS.

## Dependencies used in this project

NOTE: See the `ThirdPartyLicenses.txt` in the `public/` folder that is generated when `pnpm generate-licenses` is run for detailed licensing information.

- [Preact](https://github.com/preactjs/preact)
- [Embla](https://github.com/davidcetinkaya/embla-carousel)
- [jQuery](https://github.com/jquery/jquery)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [ts-debounce](https://github.com/chodorowicz/ts-debounce)
- [react-fontawesome](https://github.com/FortAwesome/react-fontawesome)
- [text-field-edit](https://github.com/fregante/text-field-edit)
- [lz-string](https://github.com/pieroxy/lz-string)
- [html-react-parser](https://github.com/remarkablemark/html-react-parser)
- [js-xss](https://github.com/leizongmin/js-xss)
- [zustand](https://github.com/pmndrs/zustand)
- [lodash](https://github.com/lodash/lodash)
