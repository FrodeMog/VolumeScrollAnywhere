function saveOptions() {
    var increment = document.getElementById("increment").value;
    var textColor = document.getElementById("textColor").value;
    var textSize = document.getElementById("textSize").value;
    browser.storage.local.set({ "increment": increment, "textColor": textColor, "textSize": textSize });
    updateSliderValue(increment);
    updateIncrement(increment);
    updateTextColor(currentTextColor);
    updateTextSize(currentTextSize);
}

function restoreOptions() {
    let currentIncrement, currentTextColor, currentTextSize;

    function setCurrentChoice(result) {
        currentIncrement = result.increment || "0.02";
        currentTextColor = result.textColor || "#000000";
        currentTextSize = result.textSize || "16";
        document.getElementById("increment").value = currentIncrement;
        document.getElementById("textColor").value = currentTextColor;
        document.getElementById("textSize").value = currentTextSize;
        updateSliderValue(currentIncrement);
        updateIncrement(currentIncrement);
        updateTextColor(currentTextColor);
        updateTextSize(currentTextSize);
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.local.get(["increment", "textColor", "textSize"]).then(setCurrentChoice).catch(onError);
}

function updateIncrement(newValue) {
    browser.storage.local.set({ "increment": newValue });

    // Send a message to content.js to notify it of the updated increment value
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, { type: "incrementUpdate", increment: newValue });
    });
}

function updateSliderValue(increment) {
    var sliderValueElement = document.getElementById('sliderValue');
    var percentageValue = (increment * 100).toFixed(0) + "%";
    sliderValueElement.innerText = percentageValue;
}

function updateTextColor(newValue) {
    browser.storage.local.set({ "textColor": newValue });

    // Send a message to content.js to notify it of the updated text color value
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, { type: "textColorUpdate", textColor: newValue });
    });
}

function updateTextSize(newValue) {
    browser.storage.local.set({ "textSize": newValue });

    // Send a message to content.js to notify it of the updated text size value
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, { type: "textSizeUpdate", textSize: newValue });
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("increment").addEventListener("input", saveOptions);
document.getElementById("textColor").addEventListener("input", saveOptions);
document.getElementById("textSize").addEventListener("input", saveOptions);