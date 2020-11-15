# Contributing new media API providers or content scripts

If you're interested in contributing a new API provider to Chrome Shack you can start out by look at the existing providers in the `src/core/api/` directory.

Before you start building a new provider, you should be aware of a few things:

-   Try to keep your project files in `src/core/api/`, e.g.: `src/core/api/example.ts`
-   API providers can return a React functional component (including hooks), but make sure your project file is named appropriately (e.g. `aProvider.tsx`).
-   When building your API provider, be aware that:
    -   All API providers should implement `isProviderName(href: string) => ParsedResponse` in order to function with the automated link resolver.
    -   If a provider needs to return a fetcher or pre-processor it should be included in the return `ParsedResponse` under the `cb: ...` property. Additionally, arguments passed to the callback need to be in the `args: ...` property in order for our automated link resolver to function properly.
    -   If you need to implement a fetcher/poster try to use the `fetchSafe()` derivative functions as they try to comply with the AMO security guidelines:
        -   `fetchSafe({ url: "..." })` is executed in the _context script_ context and automatically sanitizes fetched responses to prevent XSS attacks
        -   `fetchBackground({ ... })` is executed in the _background script_ context if you only need to fetch data that might otherwise violate CORB
        -   `postBackground({ url: "...", data: ... })` can be used to safely upload FormData that could return a JSON/HTML response
        -   You can pass `fetchSafe({ ..., parseType: { overrideFlag: boolean } })` if fetchSafe gives you problems when auto-detecting the response type. For a full list of flags see `src/core/common/fetch.ts`.
    -   You need to edit `src/core/api/index.ts` and check the following:
        -   Include your `import isProviderName from "...";` for your project file.
        -   Include your `isProviderName(...)` parser under the appropriate media link category.

If you're interested in contributing a new content script or feature suggestion:

-   For feature suggestions, feel free to create an issue ticket with a thorough description or code example of the feature you'd like to add.
-   For pull-requests make sure your code is rebased on the most recent version of the `master` branch.
-   A few notes that you may want to be aware of when building new content scripts for Chrome Shack:
    -   In addition to the API provider notes above, Chrome Shack also offers a variety of events that are bubbled when the Chatty page changes:
        -   `processPostEvent` is fired every time a Chatty fullpost is loaded
        -   `fullPostsCompletedEvent` is fired once when all the rootposts on the Chatty are loaded initially
        -   `processPostBoxEvent` is fired when the user opens the Reply panel of a fullpost
        -   `processRefreshIntentEvent` is fired when the user clicks the refresh icon of a fullpost
        -   `processPostRefreshEvent` is fired after a post has been refreshed on a fullpost
        -   `processEmptyTagsLoadedEvent` is fired when empty LOL tags are injected into a fullpost
        -   `processTagDataLoadedEvent` is fired when populated LOL tags are injected into a fullpost
        -   `processReplyEvent` is fired after submitting a reply to a loaded fullpost
        -   `processNotifyEvent` is fired when the WinChatty notifications system gets a new event message
    -   The WinChatty notifications' `processNotifyEvent` exposes the latest event message retrieved from the server (see: [WinChatty API](http://winchatty.com/v2/readme)).
-   Content scripts have to be registered in `content.ts`. Make sure to put event-dependent handlers **_before_** the `ChromeShack.install()` line.

# Running Cypress integration tests

The Cypress E2E integration test suite requires a login cookie fixture in order to run successfully. To setup the local testing environment do the following:
-   If you haven't already, make sure to do: `npm install`
-   Verify that Cypress and Chrome are installed and can run: `npx cypress verify`
-   Create the login cookie fixture: `CYPRESSUSR=<test user name> CYPRESSPW=<test user password> node ./utils/testlogin.js`
-   Run the Mocha test suite on a sufficiently powerful (Cypress requires sufficient memory/CPU) : `npm run mocha`
-   Look in `mochawesome-report/` for a prettified report in HTML format that aggregates the test suite results.

# Release procedure

-   Update the version in `packages.json` and `release_notes.html` (`manifest.json` is updated from `packages.json` automatically).
-   Use `npm run build:pack` to generate deployables in the `artifact/` folder when uploading to AMO or the Chrome addon store.
-   Tag a release on GitHub.
-   Add the zip to the release.
-   Release to the Chrome Web Store.
    -   Log into the [Developer Dashboard](https://chrome.google.com/u/2/webstore/devconsole/).
    -   In the upper right corner, click the "Publisher" dropdown and pick "Chrome Shack Publishers".
    -   Click on Chrome Shack in the list.
    -   Click "Store Listing" in the left pane.
    -   If there is a "Why can't I publish?" link at the top near the "Save Draft" and "Publish Item" buttons, then click that link, figure out whatever new rule Google instituted that prevents us from publishing, and fix it.
    -   Click "Package" in the left pane.
    -   Click "Upload Updated Package" in the top bar.
    -   Upload the zip.
    -   Click Publish Item. Click "PUBLISH" when prompted.
-   Release to the Firefox Add-ons site.
    -   Log into the [Add-on Developer Hub](https://addons.mozilla.org/en-US/developers/).
    -   Click "Edit Product Page" under "Chrome Shack" under "My Add-ons"
    -   Click "Upload New Version" on the left side
    -   Click "Select a file..." and pick the zip
    -   Click "Continue"
    -   Do You Need to Submit Source Code? Click "Yes", select the "src" zip in the artifacts directory, and click "Continue"
    -   Convert release notes to plain text and paste in
    -   Click "Submit Version"
    -   You're done!

# How to request release access

Gain the ability to publish new releases to the Chrome and Firefox web stores.

1. Become an organization member and gain the trust of the other members.
1. Pay the \$5 developer signup fee to Google by clicking the "Pay this fee now" button at the bottom of the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/developer/dashboard).
1. Register for a [Firefox Add-ons developer account](https://addons.mozilla.org/en-US/developers/).
1. File an issue in the `chromeshack` repository requesting publish access, and either include your Chrome Web Store and Firefox Add-on email addresses in the ticket, or arrange to send them to another publisher via Shackmessage or email.
1. An existing publisher will add you to the [Chrome Shack Publishers Google Group](https://groups.google.com/forum/#!forum/chrome-shack-publishers) as an owner, and to the [Firefox add-on authors](https://addons.mozilla.org/en-US/developers/addon/chromeshack/ownership) as an owner, and to the [GitHub organization's Trusted Publishers team](https://github.com/orgs/latestchatty/teams/trusted-publishers), and to the [list of publishers on the organization website](https://github.com/latestchatty/latestchatty.github.io/blob/master/index.md).
1. Once your request is granted, then verify that you are now holding the keys to the castle:
    - Log into the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/developer/dashboard). "Group: Chrome Shack" should appear and Chrome Shack should be listed.
    - Log into the [Firefox add-ons Developer Hub](https://addons.mozilla.org/en-US/developers/). Chrome Shack should be listed under "My Add-ons".
