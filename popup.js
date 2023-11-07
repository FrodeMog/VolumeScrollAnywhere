function updateValue(key, newValue) {
    browser.storage.local.set({ [key]: newValue });

    // Send a message to content.js to notify it of the updated value
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, { type: `${key}Update`, [key]: newValue });
    });

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
        } else {
            valueElement.innerText = newValue;
        }
    }
}

function saveOptions() {
    var increment = document.getElementById("increment").value;
    var textSize = document.getElementById("textSize").value;
    var extensionToggle = document.getElementById("extensionToggle").checked;
    updateValue("increment", increment);
    updateValue("textSize", textSize);
    updateValue("extensionToggle", extensionToggle);
}

function restoreOptions() {
    function setCurrentChoice(result) {
        let currentIncrement = result.increment || "0.02";
        let currentTextSize = result.textSize || "16";
        let currentExtensionToggle = result.extensionToggle === undefined ? true : result.extensionToggle;
        document.getElementById("increment").value = currentIncrement;
        document.getElementById("textSize").value = currentTextSize;
        document.getElementById("extensionToggle").checked = currentExtensionToggle;
        updateValue("increment", currentIncrement);
        updateValue("textSize", currentTextSize);
        updateValue("extensionToggle", currentExtensionToggle);
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.local.get(["increment", "textSize", "extensionToggle"]).then(setCurrentChoice).catch(onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("increment").addEventListener("input", saveOptions);
document.getElementById("textSize").addEventListener("input", saveOptions);
document.getElementById("extensionToggle").addEventListener("input", saveOptions);
