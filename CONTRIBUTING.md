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



