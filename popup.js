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
                    websiteList[site] = false;
                } else {
                    // If the toggle is being disabled, remove the site from the list
                    websiteList[site] = true;
                }

                // Save the updated websiteList
                browser.storage.local.set({ websiteList });

                // Send a message to content.js to notify it of the updated value
                browser.tabs.sendMessage(tabs[0].id, { type: `${key}Update`, [key]: newValue, websiteList });
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

function saveOptions() {
    var increment = document.getElementById("increment").value;
    var textSize = document.getElementById("textSize").value;
    var extensionToggle = document.getElementById("extensionToggle").checked;
    var websiteToggle = document.getElementById("websiteToggle").checked;
    var websiteUrlLabel = document.getElementById("websiteUrlLabel").innerText;

    browser.storage.local.get("websiteList").then(result => {
        const websiteList = result.websiteList;
        updateValue("websiteList", websiteList);
    });

    updateValue("increment", increment);
    updateValue("textSize", textSize);
    updateValue("extensionToggle", extensionToggle);
    updateValue("websiteToggle", websiteToggle);
    updateValue("websiteUrlLabel", websiteUrlLabel);
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
                currentWebsiteToggle = !currentWebsiteList[site];
            }
            document.getElementById("websiteToggle").checked = currentWebsiteToggle;
            document.getElementById("websiteUrlLabel").innerText = currentUrlLabel;
        });

        
        document.getElementById("increment").value = currentIncrement;
        document.getElementById("textSize").value = currentTextSize;
        document.getElementById("extensionToggle").checked = currentExtensionToggle;
        document.getElementById("websiteList").value = Object.keys(currentWebsiteList).join("\n");


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
document.getElementById("increment").addEventListener("input", saveOptions);
document.getElementById("textSize").addEventListener("input", saveOptions);
document.getElementById("extensionToggle").addEventListener("input", saveOptions);
document.getElementById("websiteToggle").addEventListener("input", saveOptions);
document.getElementById("websiteList").addEventListener("input", saveOptions);
document.getElementById("websiteUrlLabel").addEventListener("input", saveOptions);
