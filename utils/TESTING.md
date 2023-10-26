E2E Test Environment
=====

Installation instructions:
    * Use `pnpm i` and `pnpm exec playwright install --with-deps chromium` to setup the
    testing environment locally for Ubuntu/Debian or other supported operating systems.

    * In order to run all tests successfully you need to create an `.env` file in the project root with `TESTUSR` and `TESTPW` variables inside it and run `pnpm generate-cookie` to generate a cookie fixture. (Note: use 'cypresstest7654' creds here)
