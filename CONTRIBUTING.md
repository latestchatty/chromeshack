# How to request release access

First, become an organization member and gain the trust of the other members.

- For Chrome:
    - Consider creating a new Google account specifically for releasing Chrome Shack.
    - Pay the $5 developer signup fee to Google by clicking the "Pay this fee now" button at the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/developer/dashboard)
    - File an issue in the `chromeshack` repository requesting to be added to the [Chrome Shack Publishers](https://groups.google.com/forum/#!forum/chrome-shack-publishers) Google Group, and either include your Google account's email address in the issue, or otherwise get that address to one of the other Chrome Shack publishers.
    - Once you've been added to the Google Group, then go back to the [dashboard](https://chrome.google.com/webstore/developer/dashboard).
    - "Group: Chrome Shack" should appear and Chrome Shack should be listed.  If it is, then you now have the keys to the castle.  Follow the release procedure below to publish releases.
- For Firefox:
    - Register for a [Firefox Add-ons developer account](https://addons.mozilla.org/en-US/developers/).
    - File an issue in the `chromeshack` repository requesting to be added to the Firefox add-on, and either include your Firefox Add-on account's email address in the issue, or otherwise get that address to one of the other Chrome Shack publishers.
    - Once you've been added to the Firefox add-on, then go to the [dashboard](https://addons.mozilla.org/en-US/developers/).
    - Chrome Shack should be listed under "My Add-ons".  If it is, then you now have the keys to the castle.  Follow the release procedure below to publish releases.    

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



