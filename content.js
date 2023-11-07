let currentIncrement = 0.02;
let debugMode = true;
let playerFound = false;
let currentUrl = document.location.href;
let observer;

const debugMessage = (message, debugModeOverwrite) => {
    if (debugMode || debugModeOverwrite) {
        console.log(`%c[VolumeScrollAnywhere] %c[DEBUG] %c${message}`, 'color: #98ddca; font-weight: bold;', 'color: #2bd9de; font-weight: bold;', 'color: initial;');
    }
};

// Create a new HTML element to display the text
const tooltip = document.createElement('div');
tooltip.style.position = 'fixed';
tooltip.style.zIndex = '9999';
tooltip.style.backgroundColor = 'black';
tooltip.style.color = 'white';
tooltip.style.padding = '5px';
tooltip.style.borderRadius = '5px';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Hide the tooltip when the mouse moves
document.addEventListener('mousemove', () => {
    tooltip.style.display = 'none';
});// Get the elements with the textColor and textSize IDs
const textColorElement = document.getElementById('textColor');
const textSizeElement = document.getElementById('textSize');

// Set the color and font-size CSS properties based on the settings
if (textColorElement) {
    textColorElement.addEventListener('change', () => {
        const textColor = textColorElement.value;
        textColorElement.style.color = textColor;
        browser.storage.local.set({ "textColor": textColor });
    });
}

if (textSizeElement) {
    textSizeElement.addEventListener('change', () => {
        const textSize = textSizeElement.value;
        textSizeElement.style.fontSize = `${textSize}px`;
        browser.storage.local.set({ "textSize": textSize });
    });
}

const unmutePlayer = (player) => {
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
    player.style.pointerEvents = "none";

    const preventScroll = (event) => {
        if (isMouseOverPlayer(event, player)) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });

    document.addEventListener('wheel', (event) => {
        if (isMouseOverPlayer(event, player)) {
            //Show tooltip when scrolling
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX}px`;
            tooltip.style.top = `${event.clientY}px`;
            tooltip.textContent = `Volume: ${Math.round(player.volume * 100)}%`;
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
        }
    });
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
        playerFound = false;
        debugMessage("Video player not found.");
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