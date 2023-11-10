let currentIncrement = parseFloat(localStorage.getItem('currentIncrement')) || 0.02;
let currentTextSize = parseInt(localStorage.getItem('currentTextSize')) || 16;
let currentExtensionToggle = localStorage.getItem('currentExtensionToggle') === 'true';

let debugMode = true;
let playerFound = false;
let currentUrl = document.location.href;
let observer;
let tooltipTimerStarted = false;
let tooltipTimer;
let wheelHandler = null;

const debugMessage = (message, debugModeOverwrite) => {
    if (debugMode || debugModeOverwrite) {
        console.log(`%c[VolumeScrollAnywhere] %c[DEBUG] %c${message}`, 'color: #98ddca; font-weight: bold;', 'color: #2bd9de; font-weight: bold;', 'color: initial;');
    }
};

// Create a new HTML element to display the text
const tooltip = document.createElement('div');
tooltip.style.position = 'fixed';
tooltip.style.zIndex = '9999';
tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
tooltip.style.color = 'white';
tooltip.style.padding = '5px';
tooltip.style.borderRadius = '5px';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Hide the tooltip when the mouse moves
document.addEventListener('mousemove', () => {
    tooltip.style.display = 'none';
});

const unmutePlayer = (player) => { //Will lag on some sites
    //debugMessage("played muted: " + player.muted);
    if (player) {
        if (player.muted) {
            debugMessage("Unmuting player.", true);
            player.muted = false;
        } else {
            //debugMessage("Player is already unmuted.");
        }
    }
};

const isMouseOverPlayer = (event, player) => {
    const rect = player.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    return (
        mouseX >= rect.left &&
        mouseX <= rect.right &&
        mouseY >= rect.top &&
        mouseY <= rect.bottom
    );
};

const startVolumeControl = (player) => {
    debugMessage("currentextensiontoggle: " + currentExtensionToggle);
    player.style.pointerEvents = "none";

    const preventScroll = (event) => {
        if (isMouseOverPlayer(event, player) && currentExtensionToggle) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    // Remove existing listeners
    if (wheelHandler !== null) {
        document.removeEventListener('wheel', wheelHandler);
    }

    wheelHandler = (event) => {
        if (isMouseOverPlayer(event, player) && currentExtensionToggle) {
            if (event.deltaY < 0) {
                if (player.volume < 1) {
                    const newVolume = Math.min(1, player.volume + currentIncrement);
                    //unmutePlayer(player);
                    setVolume(player, newVolume);
                }
            } else {
                if (player.volume > 0) {
                    const newVolume = Math.max(0, player.volume - currentIncrement);
                    setVolume(player, newVolume);
                }
            }
            //Show tooltip when scrolling
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX}px`;
            tooltip.style.top = `${event.clientY}px`;
            tooltip.style.fontSize = `${currentTextSize}px`; // Set font size based on currentTextSize
            tooltip.textContent = `Volume: ${Math.round(player.volume * 100)}%`;
            // Hide the tooltip after 2 seconds and restart the timer
            clearTimeout(tooltipTimer);
            tooltipTimer = setTimeout(() => {
                tooltip.style.display = 'none';
            }, 1000);
        }
    };

    // Add listeners
    document.addEventListener('wheel', wheelHandler);
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
};

const setVolume = (player, rawVolume) => {
    const volume = Math.round(rawVolume * 100) / 100;
    player.volume = volume;
    const event = new Event('volumechange');
    player.dispatchEvent(event);
};

browser.runtime.onMessage.addListener((message) => {
    if (message.type === "incrementUpdate") {
        currentIncrement = parseFloat(message.increment) || currentIncrement;
        localStorage.setItem('currentIncrement', currentIncrement);
        debugMessage("Increment updated to: " + currentIncrement);
    }
    if (message.type === "textSizeUpdate") {
        currentTextSize = parseInt(message.textSize);
        localStorage.setItem('currentTextSize', currentTextSize);
        debugMessage("Text size updated to: " + currentTextSize);
    }
    if (message.type === "extensionToggleUpdate") {
        currentExtensionToggle = message.extensionToggle;
        localStorage.setItem('currentExtensionToggle', currentExtensionToggle);
        debugMessage("Extension toggle updated to: " + currentExtensionToggle);
    }
});

const checkForPlayer = () => {
    debugMessage("Checking for video player...");
    const player = document.querySelector('video');
    if (player) {
        if (!playerFound) {
            debugMessage("Video player found.", true);
            startVolumeControl(player);
            browser.storage.local.get("increment").then((result) => {
                currentIncrement = parseFloat(result.increment) || 0.02;
            });
            playerFound = true;
            if (observer) {
                observer.disconnect();
            }
        }
    } else {
        if (playerFound) {
            debugMessage("Video player not found. Stopping volume control.");
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('touchmove', preventScroll);
            player.style.pointerEvents = "auto";
            playerFound = false;
            startObserver();
        } else {
            debugMessage("Video player not found.");
        }
    }
};

const startObserver = () => {
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
                checkForPlayer();
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
};

const checkUrlChange = () => {
    const newUrl = document.location.href;
    if (newUrl !== currentUrl) {
        currentUrl = newUrl;
        playerFound = false;
        startObserver();
    }
    requestAnimationFrame(checkUrlChange);
};

startObserver();
checkUrlChange();