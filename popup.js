function updateValue(key, newValue) {
    // Get the current tab's URL
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        let url = new URL(tabs[0].url);
        let site = url.hostname;

        if (key === "websiteToggle") {
            // Get the current websiteList
            browser.storage.local.get("websiteList").then(result => {
                var websiteList = result.websiteList || {};

                // Update the websiteList
                if (newValue) {
                    // If the toggle is being enabled, add the site to the list
                    websiteList[site] = true;
                } else {
                    // If the toggle is being disabled, remove the site from the list
                    websiteList[site] = false;
                }

                // Save the updated websiteList
                browser.storage.local.set({ websiteList });

                // Send a message to content.js to notify it of the updated value
                browser.tabs.sendMessage(tabs[0].id, { type: `${key}Update`, [key]: newValue, websiteList });
                browser.storage.local.get("websiteList").then(result => {
                    const websiteList = result.websiteList;
                    updateValue("websiteList", websiteList);
                });
            });
        } 
        // For other keys, just save the new value and send the message
        browser.storage.local.set({ [key]: newValue });
        browser.tabs.sendMessage(tabs[0].id, { type: `${key}Update`, [key]: newValue });

        // Update the value in the UI
        var valueElement = document.getElementById(`${key}Value`);
        if (valueElement) {
            if (key === "increment") {
                var percentageValue = (newValue * 100).toFixed(0) + "%";
                valueElement.innerText = percentageValue;
            } else if (key === "textSize") {
                valueElement.innerText = newValue + "px";
            } else if (key === "extensionToggle") {
                valueElement.innerText = newValue ? "Enabled" : "Disabled";
            } else if (key === "websiteToggle") {
                valueElement.innerText = newValue ? "Enabled" : "Disabled";
            } else if (key === "websiteUrlLabel") {
                valueElement.innerText = url.host;
            } else {
                valueElement.innerText = newValue;
            }
        }
    });
}

function saveOptions(key) {
    var value;
    if (key === "extensionToggle" || key === "websiteToggle") {
        value = document.getElementById(key).checked;
    } else {
        value = document.getElementById(key).value;
    }
    updateValue(key, value);
}

function restoreOptions() {
    function setCurrentChoice(result) {
        let currentIncrement = result.increment || "0.02";
        let currentTextSize = result.textSize || "16";
        let currentExtensionToggle = result.extensionToggle === undefined ? true : result.extensionToggle;
        let currentWebsiteToggle = result.websiteToggle === undefined ? false : result.websiteToggle;
        let currentWebsiteList = result.websiteList || {};
        let currentUrlLabel = result.urlLabel || "";

        // Check if the current URL hostname is in the website list
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            let url = new URL(tabs[0].url);
            let site = url.hostname;
            currentUrlLabel = site;
            if (site in currentWebsiteList) {
                currentWebsiteToggle = currentWebsiteList[site];
            } else {
                currentWebsiteToggle = true; // set default value to true if website is not in list
            }
            document.getElementById("websiteToggle").checked = currentWebsiteToggle;
            document.getElementById("websiteUrlLabel").innerText = currentUrlLabel;
        });

        
        document.getElementById("increment").value = currentIncrement;
        document.getElementById("textSize").value = currentTextSize;
        document.getElementById("extensionToggle").checked = currentExtensionToggle;
        //document.getElementById("websiteList").value = Object.keys(currentWebsiteList).join("\n");


        updateValue("increment", currentIncrement);
        updateValue("textSize", currentTextSize);
        updateValue("extensionToggle", currentExtensionToggle);
        updateValue("websiteToggle", currentWebsiteToggle);
        updateValue("websiteList", currentWebsiteList);
        updateValue("websiteUrlLabel", currentUrlLabel);
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    browser.storage.local.get(["increment", "textSize", "extensionToggle", "websiteToggle", "websiteList"]).then(setCurrentChoice).catch(onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("increment").addEventListener("input", function() { saveOptions("increment"); });
document.getElementById("textSize").addEventListener("input", function() { saveOptions("textSize"); });
document.getElementById("extensionToggle").addEventListener("input", function() { saveOptions("extensionToggle"); });
document.getElementById("websiteToggle").addEventListener("input", function() { saveOptions("websiteToggle"); });
document.getElementById("websiteUrlLabel").addEventListener("input", function() { saveOptions("websiteUrlLabel"); });