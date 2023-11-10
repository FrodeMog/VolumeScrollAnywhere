// Listen for the tabs.onActivated event
browser.tabs.onActivated.addListener(async (activeInfo) => {

    let tab = await browser.tabs.get(activeInfo.tabId);
    let url = new URL(tab.url);
    let site = url.hostname;

    let result = await browser.storage.local.get("websiteList");
    let websiteList = result.websiteList || {};

    // Determine the new websiteToggle value
    let websiteToggle = websiteList[site] || false;

    // Send the websiteToggle value to the content script
    browser.tabs.sendMessage(activeInfo.tabId, { type: "websiteTabToggleUpdate", websiteToggle });
});