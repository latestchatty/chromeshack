# E2E Test Environment

Installation instructions:

- If using PNPM: use `pnpm install` and `pnpm exec playwright install --with-deps chromium` to setup the
  testing environment locally for Ubuntu/Debian or other supported operating systems.

- If using NPM: use `npm install` and `npx playwright install --with-deps chromium` to setup the
  testing environment locally for Ubuntu/Debian or other supported operating systems.

- In order to run all tests successfully you need to create an `.env` file in the project root with `TESTUSR` and `TESTPW` variables inside it and run `pnpm generate-cookie` or `npm run generate-cookie` to generate a cookie fixture. (Note: use 'cypresstest' creds here)
