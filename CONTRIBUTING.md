# How to request release access

Gain the ability to publish new releases to the Chrome and Firefox web stores.

1. Become an organization member and gain the trust of the other members.
1. Pay the $5 developer signup fee to Google by clicking the "Pay this fee now" button at the bottom of the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/developer/dashboard).
1. Register for a [Firefox Add-ons developer account](https://addons.mozilla.org/en-US/developers/).
1. File an issue in the `chromeshack` repository requesting publish access, and either include your Chrome Web Store and Firefox Add-on email addresses in the ticket, or arrange to send them to another publisher via Shackmessage or email.
1. An existing publisher will add you to the [Chrome Shack Publishers Google Group](https://groups.google.com/forum/#!forum/chrome-shack-publishers) as an owner, and to the [Firefox add-on authors](https://addons.mozilla.org/en-US/developers/addon/chromeshack/ownership) as an owner, and to the [GitHub organization's Trusted Publishers team](https://github.com/orgs/latestchatty/teams/trusted-publishers), and to the [list of publishers on the organization website](https://github.com/latestchatty/latestchatty.github.io/blob/master/index.md).
1. Once your request is granted, then verify that you are now holding the keys to the castle:
    - Log into the  [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/developer/dashboard).  "Group: Chrome Shack" should appear and Chrome Shack should be listed.
    - Log into the [Firefox add-ons Developer Hub](https://addons.mozilla.org/en-US/developers/).  Chrome Shack should be listed under "My Add-ons".

# Release procedure

- Update `release_notes.html` and `manifest.json` so they have the same new version number.
- Tag a release on GitHub.
- Zip the Git repo from INSIDE, don't zip the folder, the files should be at the root of the zip.  Also don't include the .git folder.
- Release to the Chrome Web Store.
    - Log into the [Developer Dashboard](https://chrome.google.com/u/2/webstore/devconsole/).
    - Click on Chrome Shack in the list.
    - Click "Store Listing" in the left pane.
    - If there is a "Why can't I publish?" link at the top near the "Save Draft" and "Publish Item" buttons, then click that link, figure out whatever new rule Google instituted that prevents us from publishing, and fix it.
    - Click "Package" in the left pane.
    - Click "Upload Updated Package" in the top bar.
    - Upload the zip.
    - Click Publish Item.  Click "PUBLISH" when prompted.
- Release to the Firefox Add-ons site.
    - Log into the [Add-on Developer Hub](https://addons.mozilla.org/en-US/developers/).
    - Click "Edit Listing" under "Chrome Shack" under "My Add-ons"
    - Click "Upload New Version" on the left side
    - Click "Select a file..." and pick the zip
    - Click "Continue"
    - Do You Need to Submit Source Code?  Click "No", click "Continue"
    - Convert release notes to plain text and paste in
    - Click "Submit Version"
    - You're done!



