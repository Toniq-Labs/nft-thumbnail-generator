# nft-thumbnail-generator

Code to generate NFT thumbnails from any on-chain NFT type.

Example output (generated from the test command explained below): https://toniq-labs.github.io/nft-thumbnail-generator

Note that this server does not handle caching of these thumbnails.

# How to use

## Logs

All logs are stored in the `logs` directory, separated by info logs and error logs.

## Production startup

1.  Clone this repo
2.  Run `npm ci` from the root of this repo
3.  Run the startup script from the root of this repo: `npm start prod <port-number> <external-content-origin>`
    -   Example: `npm start prod 8321 "https://ordinals.com"` (note: ideally you'd run your own server rather than using `ordinals.com` directly)

The port number you provide (`8321` in the above example) will be the port that the thumbnail generator server will listen to. (So forward requests from Nginx or whatever to that port.)

## Requesting thumbnails

Once you've got the server up and running, request a thumbnail generation via the following URL: `http://localhost:<port-number>/thumbnail/<nft-id>`

-   `<port-number>`: the port number you selected when running the production startup command, as explained in the previous section.
<!-- cspell:disable -->
-   `<nft-id>`: the hash id of the NFT, such as `3ab3d8dcd31cc8db0f0feaf2373c444697aae275a108ba72615c93de5ebcc4f8i0`

Example: `http://localhost:8321/thumbnail/3ab3d8dcd31cc8db0f0feaf2373c444697aae275a108ba72615c93de5ebcc4f8i0`

<!-- cspell:enable -->

## Test startup

To run test, replace `prod` in the above startup command with `test`.

Example: `npm start test 8321 "https://ordinals.com"` (note: ideally you'd run your own server rather than using `ordinals.com` directly)

The test command dumps screenshots into the `./not-committed/test-output` directory. This directory will include an `index.html` file with which to easily view all the test outputs. The test command tries to open this html file in a browser. If it doesn't launch for you, you'll have to manually open the file.
