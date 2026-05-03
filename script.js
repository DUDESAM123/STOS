/**
 * Stranger OS - Core Javascript
 * This file handles the interactive, "humanized" features of the Web OS.
 */

// --- 1. The "Gate" Toggle (Theme Switch) ---
const gateToggleBtn = document.getElementById('gate-toggle');
const synthSwellAudio = document.getElementById('synth-swell');

gateToggleBtn.addEventListener('click', () => {
    // 1a. Toggle the '.upside-down' class on the body to trigger CSS transitions
    document.body.classList.toggle('upside-down');
    
    // Check current state
    const isUpsideDown = document.body.classList.contains('upside-down');
    
    // Update button text accordingly
    gateToggleBtn.textContent = isUpsideDown ? 'Close The Gate' : 'Open The Gate';
    
    // Update data-text attributes for glitch effect to match content
    document.querySelectorAll('.clock-text, .window-title').forEach(el => {
        el.setAttribute('data-text', el.textContent.trim());
    });

    // 1b. Play the hidden synth swell audio element
    if (synthSwellAudio) {
        synthSwellAudio.currentTime = 0; // Reset audio to start
        synthSwellAudio.volume = 0.6; // Adjust volume
        synthSwellAudio.play().catch(e => {
            console.warn("Audio playback requires user interaction first, or media failed to load.", e);
        });
    }
});


// --- 2. Draggable Windows Logic ---
// We keep track of z-index so the most recently clicked window comes to the front.
let globalZIndex = 10;

/**
 * Attaches drag event listeners to a given window element.
 * @param {HTMLElement} windowElement - The window container.
 */
function makeDraggable(windowElement) {
    const header = windowElement.querySelector('.window-header');
    if (!header) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    // Mouse Down on Header: Start Dragging
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        
        // Bring window to front
        globalZIndex++;
        windowElement.style.zIndex = globalZIndex;

        // Record initial mouse and window coordinates
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = windowElement.offsetLeft;
        initialTop = windowElement.offsetTop;

        // Prevent text selection while dragging for a smoother experience
        document.body.style.userSelect = 'none';
        header.style.cursor = 'grabbing';
    });

    // Mouse Move on Document: Update Position
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Calculate how far the mouse has moved
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Apply new position to window
        windowElement.style.left = `${initialLeft + deltaX}px`;
        windowElement.style.top = `${initialTop + deltaY}px`;
    });

    // Mouse Up on Document: Stop Dragging
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            header.style.cursor = 'grab';
        }
    });
    
    // Also bring to front when clicking anywhere inside the window body
    windowElement.addEventListener('mousedown', () => {
        globalZIndex++;
        windowElement.style.zIndex = globalZIndex;
    });
}

// Initialize dragging for all existing windows
document.querySelectorAll('.window').forEach(makeDraggable);


// --- 3. Window Management (Open/Close) ---
window.openWindow = function(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.remove('hidden');
        win.classList.add('flex');
        
        // Bring to front when opened
        globalZIndex++;
        win.style.zIndex = globalZIndex;
        
        // If opening terminal, focus input
        if (id === 'ai-tutor') {
            document.getElementById('terminal-input').focus();
        }
    }
};

window.closeWindow = function(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.add('hidden');
        win.classList.remove('flex');
    }
};


// --- 4. The AI Tutor (Cerebro) - Typewriter Effect ---
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');

/**
 * Creates a humanized, retro typewriter effect by adding characters one by one.
 * @param {string} text - The string to type out.
 * @param {HTMLElement} element - The container to append the text to.
 * @param {number} speed - Base typing speed in milliseconds.
 */
async function typeWriter(text, element, speed = 50) {
    // 4a. Add a temporary blinking cursor block
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    element.appendChild(cursor);

    for (let i = 0; i < text.length; i++) {
        // Create a text node for each character
        const charNode = document.createTextNode(text.charAt(i));
        // Insert before the cursor
        element.insertBefore(charNode, cursor);
        
        // Auto-scroll to the bottom of the terminal window
        element.parentElement.scrollTop = element.parentElement.scrollHeight;
        
        // Wait for the specified speed, adding slight randomness for a 'human' feel
        const randomDelay = speed + (Math.random() * 40 - 20); 
        await new Promise(resolve => setTimeout(resolve, randomDelay));
    }
    
    // Add a line break at the end of the message
    element.insertBefore(document.createElement('br'), cursor);
    
    // 4b. Remove the cursor after typing is complete
    cursor.remove();
}

// Handle user input in the AI Tutor terminal
terminalInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const value = terminalInput.value.trim();
        if (value) {
            // Echo the user's command to the terminal immediately
            terminalOutput.innerHTML += `> ${value}<br>`;
            terminalInput.value = ''; // Clear input
            
            // Scroll to bottom
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
            
            // Disable input briefly to simulate network processing
            terminalInput.disabled = true;
            await new Promise(resolve => setTimeout(resolve, 600));
            
            // Pool of themed, mysterious responses
            const responses = [
                "I copy. The air is cold here...",
                "Friends don't lie.",
                "Look for the lights.",
                "011... she is near.",
                "Error: Entity detected in the vicinity.",
                "Is anyone there? ... Over.",
                "Running Hawkins Lab decryption protocols..."
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            // 4c. Trigger the typewriter effect for the AI's response
            await typeWriter(randomResponse, terminalOutput, 40);
            
            // Re-enable input after response is typed
            terminalInput.disabled = false;
            terminalInput.focus();
        }
    }
});


// --- 5. System Clock ---
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Format to 12-hour clock
    hours = hours % 12;
    hours = hours ? hours : 12; 
    
    // Add leading zero to minutes
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    const timeString = `${hours}:${minutes} ${ampm}`;
    const clockEl = document.getElementById('clock');
    clockEl.textContent = timeString;
    // Update data attribute for glitch effect
    clockEl.setAttribute('data-text', timeString);
}
// Start clock immediately, update every second
updateClock();
setInterval(updateClock, 1000);

// --- 6. Timer App Logic ---
let timerInterval;
let timerSeconds = 0;
let isTimerRunning = false;
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer');
const resetTimerBtn = document.getElementById('reset-timer');

function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const secs = (timerSeconds % 60).toString().padStart(2, '0');
    if (timerDisplay) timerDisplay.textContent = `${mins}:${secs}`;
}

if (startTimerBtn) {
    startTimerBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            startTimerBtn.textContent = 'START';
            isTimerRunning = false;
        } else {
            timerInterval = setInterval(() => {
                timerSeconds++;
                updateTimerDisplay();
            }, 1000);
            startTimerBtn.textContent = 'PAUSE';
            isTimerRunning = true;
        }
    });
}

if (resetTimerBtn) {
    resetTimerBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerSeconds = 0;
        updateTimerDisplay();
        startTimerBtn.textContent = 'START';
        isTimerRunning = false;
    });
}

// --- 7. Walkie Talkie App Logic ---
let currentChannel = 11;
const walkieChannel = document.getElementById('walkie-channel');
const channelUpBtn = document.getElementById('channel-up');
const channelDownBtn = document.getElementById('channel-down');
const pttBtn = document.getElementById('ptt-btn');

function updateChannelDisplay() {
    if (walkieChannel) walkieChannel.textContent = currentChannel;
}

if (channelUpBtn) {
    channelUpBtn.addEventListener('click', () => {
        currentChannel = currentChannel < 40 ? currentChannel + 1 : 1;
        updateChannelDisplay();
    });
}

if (channelDownBtn) {
    channelDownBtn.addEventListener('click', () => {
        currentChannel = currentChannel > 1 ? currentChannel - 1 : 40;
        updateChannelDisplay();
    });
}

if (pttBtn) {
    pttBtn.addEventListener('mousedown', () => {
        if (walkieChannel) {
            walkieChannel.classList.add('text-green-500', 'glow-text-green');
            walkieChannel.classList.remove('text-red-500', 'glow-text-red');
        }
    });
    
    // Also handle touch events for mobile
    pttBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (walkieChannel) {
            walkieChannel.classList.add('text-green-500', 'glow-text-green');
            walkieChannel.classList.remove('text-red-500', 'glow-text-red');
        }
    });

    const stopTransmission = () => {
        if (walkieChannel) {
            walkieChannel.classList.remove('text-green-500', 'glow-text-green');
            walkieChannel.classList.add('text-red-500', 'glow-text-red');
        }
    };
    
    pttBtn.addEventListener('mouseup', stopTransmission);
    pttBtn.addEventListener('mouseleave', stopTransmission);
    pttBtn.addEventListener('touchend', stopTransmission);
}

// --- 8. Intro Boot Screen Logic ---
document.addEventListener("DOMContentLoaded", () => {
    const startOverlay = document.getElementById('start-overlay');
    const introScreen = document.getElementById('intro-screen');
    const introMusic = document.getElementById('intro-music');
    
    if (startOverlay && introScreen) {
        startOverlay.addEventListener('click', () => {
            // Remove start overlay
            startOverlay.remove();
            
            // Show intro screen and start CSS animations
            introScreen.classList.remove('hidden');
            
            // Play music
            if (introMusic) {
                introMusic.volume = 0.6;
                introMusic.play().catch(e => console.log("Audio play failed:", e));
            }
            
            // The CSS animation takes 5 seconds, so we start fading out after 5.5s
            setTimeout(() => {
                introScreen.classList.add('transition-opacity', 'duration-1000');
                introScreen.style.opacity = '0';
                introScreen.style.pointerEvents = 'none';
                
                // Fade out audio slowly
                if (introMusic) {
                    let fadeAudio = setInterval(() => {
                        if (introMusic.volume > 0.05) {
                            introMusic.volume -= 0.05;
                        } else {
                            introMusic.pause();
                            clearInterval(fadeAudio);
                        }
                    }, 200);
                }

                // Remove from DOM after the CSS fade out transition (1s)
                setTimeout(() => {
                    introScreen.remove();
                }, 1000);
            }, 5500);
        });
    }
});

// --- 9. Calculator Logic ---
let calcCurrent = '0';
let calcPrevious = null;
let calcOperator = null;
let calcResetDisplay = false;

function updateCalcDisplay() {
    const display = document.getElementById('calc-display');
    if (display) {
        display.textContent = calcCurrent;
    }
}

window.calcAction = function(type, value) {
    if (type === 'clear') {
        calcCurrent = '0';
        calcPrevious = null;
        calcOperator = null;
        calcResetDisplay = false;
    } else if (type === 'delete') {
        if (calcCurrent === 'Error') {
            calcCurrent = '0';
        } else if (calcCurrent.length > 1) {
            calcCurrent = calcCurrent.slice(0, -1);
        } else {
            calcCurrent = '0';
        }
    } else if (type === 'number') {
        if (calcCurrent === '0' || calcCurrent === 'Error' || calcResetDisplay) {
            if (value === '.') {
                calcCurrent = '0.';
            } else {
                calcCurrent = value;
            }
            calcResetDisplay = false;
        } else {
            if (value === '.' && calcCurrent.includes('.')) return;
            // Prevent extremely long numbers that break the UI
            if (calcCurrent.length < 15) {
                calcCurrent += value;
            }
        }
    } else if (type === 'operator') {
        if (calcCurrent === 'Error') return;
        if (calcOperator !== null && !calcResetDisplay) {
            calcAction('equals');
        }
        calcPrevious = calcCurrent;
        calcOperator = value;
        calcResetDisplay = true;
    } else if (type === 'equals') {
        if (calcOperator === null || calcPrevious === null || calcCurrent === 'Error') return;
        
        const prev = parseFloat(calcPrevious);
        const curr = parseFloat(calcCurrent);
        let result = 0;
        
        switch(calcOperator) {
            case '+': result = prev + curr; break;
            case '-': result = prev - curr; break;
            case '*': result = prev * curr; break;
            case '/': 
                if (curr === 0) {
                    calcCurrent = 'Error';
                    calcOperator = null;
                    calcPrevious = null;
                    calcResetDisplay = true;
                    updateCalcDisplay();
                    return;
                }
                result = prev / curr; 
                break;
        }
        
        // Handle floating point precision issues
        result = Math.round(result * 100000000) / 100000000;
        calcCurrent = result.toString();
        calcOperator = null;
        calcPrevious = null;
        calcResetDisplay = true;
    }
    
    updateCalcDisplay();
};
