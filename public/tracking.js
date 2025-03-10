(function () {
    // Get API key from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get("api_key");
    if (!apiKey) {
        console.warn("❌ Missing API key for tracking script.");
        return;
    }

    const serverEndpoint = "https://kp-orchestration-layer.fly.dev/kprotect-ol/api/user-tracking";
    let mouseData = [], keyboardData = [], buttonClickData = [], lastKeyReleaseTime = null;

    /** ---------------------- Mouse Event Tracking ---------------------- **/
    function trackMouseEvents() {
        document.addEventListener("mousemove", throttle((event) => {
            mouseData.push({ x: event.clientX, y: event.clientY, type: "move", time: Date.now() });
        }, 100));

        document.addEventListener("click", (event) => 
            mouseData.push({ x: event.clientX, y: event.clientY, type: "click", time: Date.now() })
        );

        let scrollTimeout;
        document.addEventListener("scroll", () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                mouseData.push({ scrollX: window.scrollX, scrollY: window.scrollY, type: "scroll", time: Date.now() });
            }, 200);
        });
    }

    /** ---------------------- Keyboard Event Tracking ---------------------- **/
    function trackKeyboardEvents() {
        document.addEventListener("keydown", (event) => {
            if (!keyboardData.some((data) => data.key === event.key && data.end === null)) {
                const startTime = Date.now();
                keyboardData.push({
                    key: event.key,
                    start: startTime,
                    end: null,
                    hold: null,
                    releaseToPress: lastKeyReleaseTime ? startTime - lastKeyReleaseTime : null
                });
            }
        });

        document.addEventListener("keyup", (event) => {
            const keyEvent = keyboardData.find((data) => data.key === event.key && data.end === null);
            if (keyEvent) {
                keyEvent.end = Date.now();
                keyEvent.hold = keyEvent.end - keyEvent.start;
                lastKeyReleaseTime = keyEvent.end;
            }
        });
    }

    /** ---------------------- Send Data to Server ---------------------- **/
    async function sendData(triggeredBy = "form submission", buttonData = null) {
        const [publicIP, geoDetails] = await Promise.all([getPublicIP(), getGeoDetails()]);
        if (buttonData) buttonClickData.push(buttonData);

        try {
            await fetch(serverEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    apiKey,
                    deviceDetails: getDeviceDetails(),
                    publicIP,
                    geoDetails,
                    mouseData,
                    keyboardData,
                    buttonClickData,
                    triggeredBy
                }),
            });

            console.log(`✅ Data sent successfully (${triggeredBy})`);
            // Reset arrays separately
            mouseData = [];
            keyboardData = [];
            buttonClickData = [];
        } catch (error) {
            console.error("❌ Error sending data:", error);
        }
    }

    /** ---------------------- Device & Browser Info ---------------------- **/
    function getDeviceDetails() {
        return {
            browser: getBrowserName(),
            os: getOS(),
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language || navigator.userLanguage,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    function getOS() {
        const ua = navigator.userAgent.toLowerCase();
        return ua.includes("windows") ? "Windows" :
            ua.includes("mac") ? "MacOS" :
            ua.includes("linux") ? "Linux" :
            ua.includes("android") ? "Android" :
            ua.includes("iphone") || ua.includes("ipad") ? "iOS" : "Unknown";
    }

    function getBrowserName() {
        const ua = navigator.userAgent;
        return ua.includes("Chrome") ? "Chrome" :
            ua.includes("Firefox") ? "Firefox" :
            ua.includes("Safari") && !ua.includes("Chrome") ? "Safari" :
            ua.includes("Edge") ? "Edge" :
            ua.includes("Opera") || ua.includes("OPR") ? "Opera" :
            ua.includes("MSIE") || ua.includes("Trident") ? "Internet Explorer" : "Unknown";
    }

    /** ---------------------- Public IP & Geo Tracking ---------------------- **/
    async function getPublicIP() {
        try {
            const res = await fetch("https://api64.ipify.org?format=json");
            return (await res.json()).ip;
        } catch {
            return "Unknown";
        }
    }

    async function getGeoDetails() {
        try {
            const res = await fetch("https://ip-api.com/json/");
            const data = await res.json();
            return { city: data.city || "Unknown", country: data.country || "Unknown", isp: data.isp || "Unknown" };
        } catch {
            return "Unknown";
        }
    }

    /** ---------------------- Button Click Tracking ---------------------- **/
    document.body.addEventListener("click", async (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        let buttonText = button.innerText.trim() || button.getAttribute("aria-label") || button.getAttribute("title") || "Unnamed Button";
        const buttonData = { text: buttonText, id: button.id || "No ID", class: button.className || "No Class", tagName: button.tagName, time: Date.now() };

        console.log(`🔘 Button Clicked: ${buttonData.text} (ID: ${buttonData.id}, Class: ${buttonData.class})`);
        await sendData("button click", buttonData);
    });

    /** ---------------------- Utility Functions ---------------------- **/
    function throttle(func, limit) {
        let lastFunc, lastRan;
        return function () {
            const context = this, args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if (Date.now() - lastRan >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    /** ---------------------- Initialize Tracking ---------------------- **/
    document.addEventListener("DOMContentLoaded", () => {
        trackMouseEvents();
        trackKeyboardEvents();
    });

})();
