const DEFAULT_INCREMENT = 0.02;
const DEFAULT_TEXT_SIZE = 16;
const DEFAULT_EXTENSION_TOGGLE = true;
const TOOLTIP_DISPLAY_TIME = 1000;
const TOOLTIP_HIDE_DELAY = 2000;

let currentIncrement = parseFloat(localStorage.getItem('currentIncrement')) || DEFAULT_INCREMENT;
let currentTextSize = parseInt(localStorage.getItem('currentTextSize')) || DEFAULT_TEXT_SIZE;
let currentExtensionToggle = localStorage.getItem('currentExtensionToggle') !== 'false'
let currentWebsiteToggle = localStorage.getItem('currentWebsiteToggle') !== 'false'
let currentWebsiteList = localStorage.getItem('currentWebsiteList') || '';

let debugMode = true;
let playerFound = false;
let currentUrl = document.location.href;
let observer;
let tooltipTimerStarted = false;
let tooltipTimer;
let wheelHandler = null;

const tooltip = createTooltip();

document.addEventListener('mousemove', hideTooltip);

function debugMessage(message, debugModeOverwrite = false) {
    if (debugMode || debugModeOverwrite) {
        console.log(`%c[VolumeScrollAnywhere] %c[DEBUG] %c${message}`, 'color: #98ddca; font-weight: bold;', 'color: #2bd9de; font-weight: bold;', 'color: initial;');
    }
}

function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '9999';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    return tooltip;
}

function hideTooltip() {
    tooltip.style.display = 'none';
}

function unmutePlayer(player) {
    if (player && player.muted) {
        debugMessage("Unmuting player.", true);
        player.muted = false;
    }
}

let getVideo = function (event) {
    let elements = document.elementsFromPoint(event.clientX, event.clientY);
    debugMessage(elements);
    for (const element of elements) {
        if (element.tagName === "VIDEO") {
            return { display: element, video: element, slider: null };
        }
        else if (element.tagName === "SHREDDIT-PLAYER"){
            let video = element.shadowRoot.querySelector("VIDEO");
            let slider = element.shadowRoot.querySelector("VDS-VOLUME-SLIDER")
            return { display: element, video: video, slider: slider };
        }
        else if (element.tagName === "YTMUSIC-PLAYER" || element.tagName === "YTMUSIC-PLAYER-BAR") {
            let video = document.getElementsByTagName("VIDEO")[0];
            let display = document.getElementById("song-image");
            let slider = document.getElementById("volume-slider");
            return { display: display, video: video, slider: slider };
        }
    }
    return null;
}

function isMouseOverPlayer(event, player) {
    const rect = player.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    getVideo(event);
    return (
        mouseX >= rect.left &&
        mouseX <= rect.right &&
        mouseY >= rect.top &&
        mouseY <= rect.bottom
    );
}

function startVolumeControl(player) {
    player.style.pointerEvents = "none";
    const preventScroll = (event) => {
        if (isMouseOverPlayer(event, player) && currentExtensionToggle && currentWebsiteToggle) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    // Remove existing listeners
    if (wheelHandler !== null) {
        document.removeEventListener('wheel', wheelHandler);
    }
    wheelHandler = (event) => {
        if (isMouseOverPlayer(event, player) && currentExtensionToggle && currentWebsiteToggle) {
            player.style.pointerEvents = "none"; // Disable pointer events
            if (event.deltaY < 0) {
                if (player.volume < 1) {
                    const newVolume = Math.min(1, player.volume + currentIncrement);
                    unmutePlayer(player);
                    setVolume(player, newVolume);
                }
            } else {
                if (player.volume > 0) {
                    const newVolume = Math.max(0, player.volume - currentIncrement);
                    setVolume(player, newVolume);
                }
            }
            // Show tooltip when scrolling
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX}px`;
            tooltip.style.top = `${event.clientY}px`;
            tooltip.style.fontSize = `${currentTextSize}px`;
            tooltip.textContent = `Volume: ${Math.round(player.volume * 100)}%`;
            // Hide the tooltip after a delay and restart the timer
            clearTimeout(tooltipTimer);
            tooltipTimer = setTimeout(hideTooltip, TOOLTIP_DISPLAY_TIME);
            setTimeout(() => {
                player.style.pointerEvents = "auto"; // Re-enable pointer events
            }, 100);
        }
    };
    document.addEventListener('wheel', wheelHandler);
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
}

function setVolume(player, rawVolume) {
    const volume = Math.round(rawVolume * 100) / 100;
    player.volume = volume;
    const event = new Event('volumechange');
    player.dispatchEvent(event);
}

function checkForPlayer(players) {
    debugMessage("Setting up player volume control.");
    players.forEach(player => {
        if (player) {
            if (!playerFound) {
                startVolumeControl(player);
                browser.storage.local.get("increment").then((result) => {
                    currentIncrement = parseFloat(result.increment) || DEFAULT_INCREMENT;
                });
                playerFound = true;
                debugMessage("Video player found.", true);
                if (observer) {
                    observer.disconnect();
                }
            }
        } else {
            if (playerFound) {
                debugMessage("Video player not found. Stopping volume control.");
                document.removeEventListener('wheel', preventScroll);
                document.removeEventListener('touchmove', preventScroll);
                if (player) { 
                    player.style.pointerEvents = "auto";
                }
                playerFound = false;
                startObserver();
            } else {
                debugMessage("Video player not found.");
            }
        }
    });
}

function startObserver() {
    if (observer) {
        observer.disconnect();
    }
    observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (
                mutation.type === 'childList' &&
                mutation.addedNodes.length > 0 &&
                mutation.target.nodeName.toLowerCase() !== 'script'
            ) {
                debugMessage("Mutation detected. Checking for player.");
                let players = Array.from(document.querySelectorAll('video'));
                checkForPlayer(players);
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function checkUrlChange() {
    const newUrl = document.location.href;
    if (newUrl !== currentUrl) {
        currentUrl = newUrl;
        playerFound = false;
        startObserver();
    }
    requestAnimationFrame(checkUrlChange);
}

function handleIncrementUpdate(message) {
    currentIncrement = parseFloat(message.increment) || DEFAULT_INCREMENT;
    localStorage.setItem('currentIncrement', currentIncrement);
    debugMessage("Increment updated to: " + currentIncrement);
}

function handleTextSizeUpdate(message) {
    currentTextSize = parseInt(message.textSize);
    localStorage.setItem('currentTextSize', currentTextSize);
    debugMessage("Text size updated to: " + currentTextSize);
}

function handleExtensionToggleUpdate(message) {
    currentExtensionToggle = message.extensionToggle;
    localStorage.setItem('currentExtensionToggle', currentExtensionToggle);
    debugMessage("Extension toggle updated to: " + currentExtensionToggle);
}

function handleWebsiteToggleUpdate(message) {
    currentWebsiteToggle = message.websiteToggle;
    localStorage.setItem('currentWebsiteToggle', currentWebsiteToggle);
    debugMessage("Website toggle updated to: " + currentWebsiteToggle);
}

function handleWebsiteListUpdate(message) {
    currentWebsiteList = message.websiteList;
    localStorage.setItem('currentWebsiteList', currentWebsiteList);
    debugMessage("Website list updated to: " + currentWebsiteList);
    if(debugMode) {
        console.log(currentWebsiteList);
    }
}

function handleWebsiteTabToggleUpdate(message) {
    currentWebsiteToggle = message.websiteToggle;
    localStorage.setItem('currentWebsiteToggle', currentWebsiteToggle);
    debugMessage("Website tab toggle updated to: " + currentWebsiteToggle);
}

browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
        case "incrementUpdate":
            handleIncrementUpdate(message);
            break;
        case "textSizeUpdate":
            handleTextSizeUpdate(message);
            break;
        case "extensionToggleUpdate":
            handleExtensionToggleUpdate(message);
            break;
        case "websiteToggleUpdate":
            handleWebsiteToggleUpdate(message);
            break;
        case "websiteListUpdate":
            handleWebsiteListUpdate(message);
            break;
        case "websiteTabToggleUpdate":
            handleWebsiteTabToggleUpdate(message);
            break;
        default:
            break;
    }
});

startObserver();
checkUrlChange();