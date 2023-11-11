# Volume Scroll Anywhere

## Description
Volume Scroll Anywhere is a Firefox extension that allows you to use mousewheel scrolling to control audio on hopefully any video player or stream.

## How to Debug/Launch
To debug or launch the extension, follow these steps:
1. Install the [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) tool.
2. Run `web-ext run` in the terminal to launch the extension or press F5 in VSCode using launch.json.
3. Run `web-ext build --overwrite-dest --config-discovery` to build - and find the .zip in ***/web-ext-artifacts/***.
4. `web-ext-config.js` contains the files that are not required to build


## Issues
1. Unmute might cause issues if audio autoplay isn't allowed
2. If a player is refreshed or reloaded by a website the script won't re-search
3. A popup before a player launch could avoid player search
4. Some websites or players might not work
5. Website with multiple players could cause massive issues
6. Will probably conflict with other similar extensions
8. Correct textSize and increment aren't loaded on restoreOptions
