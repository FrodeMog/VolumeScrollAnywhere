// Listen for the tabs.onActivated event
browser.tabs.onActivated.addListener(async (activeInfo) => {

    let tab = await browser.tabs.get(activeInfo.tabId);
    let url = new URL(tab.url);
    let site = url.hostname;

    let result = await browser.storage.local.get(["websiteList", "increment", "textSize", "extensionToggle"]);
    let websiteList = result.websiteList || {};
    let increment = result.increment || 1;
    let textSize = result.textSize || 16;
    let extensionToggle = result.extensionToggle !== undefined ? result.extensionToggle : true;

    // Determine the new websiteToggle value
    let websiteToggle = websiteList[site] !== undefined ? websiteList[site] : true;

    // Send the websiteToggle, increment, textsize, and extensiontoggle values to the content script
    browser.tabs.sendMessage(activeInfo.tabId, { type: "websiteTabToggleUpdate", websiteToggle });
    browser.tabs.sendMessage(activeInfo.tabId, { type: "incrementUpdate", increment });
    browser.tabs.sendMessage(activeInfo.tabId, { type: "textSizeUpdate", textSize });
    browser.tabs.sendMessage(activeInfo.tabId, { type: "extensionToggleUpdate", extensionToggle });
});