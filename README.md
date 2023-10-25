# nft-thumbnail-generator

Code to generate NFT thumbnails from any on-chain NFT type.

Example output (generated from the test command explained below): https://toniq-labs.github.io/nft-thumbnail-generator

# How to use

## Production startup

1.  Clone this repo
2.  Run `npm ci` from the root of this repo
3.  Run the startup script from the root of this repo: `npm start prod <port-number> <external-content-origin>`
    -   Example: `npm start prod 8321 "https://ordinals.com"` (note: ideally you'd run your own server rather than using `ordinals.com` directly)

The port number you provide (`8321` in the above example) will be the port that the thumbnail generator server will listen to. (So forward requests from Nginx or whatever to that port.)

## Test startup

To run test, replace `prod` in the above startup command with `test`.

Example: `npm start test 8321 "https://ordinals.com"` (note: ideally you'd run your own server rather than using `ordinals.com` directly)

The test command dumps screenshots into the `./not-committed/test-output` directory. This directory will include an `index.html` file with which to easily view all the test outputs. The test command tries to open this html file in a browser. If it doesn't launch for you, you'll have to manually open the file.
