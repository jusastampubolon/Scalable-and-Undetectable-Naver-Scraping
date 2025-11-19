import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import UserAgent from 'user-agents';
// Use stealth plugin
puppeteer.use(StealthPlugin());
let browser = null;
// Advanced proxy configuration
const USE_PROXY = true;
const PROXY_SERVER = "network.mrproxy.com:10000";
const PROXY_USERNAME = "hiring-country-kr";
const PROXY_PASSWORD = "12345678";
// Common Korean cookies to appear as returning user
const KOREAN_COOKIES = [
    {
        name: 'NID_AUT',
        value: 'test_korean_user',
        domain: '.naver.com',
        path: '/',
        expires: Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000),
        httpOnly: true,
        secure: true
    },
    {
        name: 'NID_SES',
        value: 'AAABBBCCCDDD',
        domain: '.naver.com',
        path: '/',
        expires: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
        httpOnly: true,
        secure: true
    }
];
// Korean viewport sizes (common devices in Korea)
const VIEWPORT_SIZES = [
    { width: 1920, height: 1080 }, // Desktop
    { width: 1536, height: 864 }, // Laptop
    { width: 1366, height: 768 }, // Laptop
    { width: 414, height: 896 }, // iPhone
    { width: 390, height: 844 }, // iPhone
    { width: 360, height: 800 } // Android
];
export async function getBrowser() {
    if (!browser || !browser.isConnected()) { // ✅ FIX: Use isConnected() instead of connected
        const launchOptions = {
            headless: "new", // Use new headless mode
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-ipc-flooding-protection",
                "--enable-features=NetworkService,NetworkServiceInProcess",
                "--hide-scrollbars",
                "--mute-audio"
            ],
            defaultViewport: null,
            ignoreHTTPSErrors: true
        };
        if (USE_PROXY) {
            launchOptions.args.push(`--proxy-server=http://${PROXY_SERVER}`);
            console.log(`🛜 Using Korean proxy: ${PROXY_SERVER}`);
        }
        try {
            browser = await puppeteer.launch(launchOptions);
            browser.on("disconnected", () => {
                console.log("🔌 Browser disconnected");
                browser = null;
            });
        }
        catch (error) {
            console.error("❌ Browser launch failed:", error.message);
            throw error;
        }
    }
    return browser;
}
// Human-like random delays
const humanDelay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
// Human-like mouse movements
async function humanMouseMovement(page) {
    const viewport = await page.viewport();
    if (!viewport)
        return;
    const moves = Math.floor(Math.random() * 3) + 2; // 2-4 moves
    for (let i = 0; i < moves; i++) {
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;
        await page.mouse.move(x, y, {
            steps: Math.floor(Math.random() * 10) + 5 // 5-14 steps for smooth movement
        });
        await humanDelay();
    }
}
// Human-like scrolling
async function humanScroll(page) {
    const viewport = await page.viewport();
    if (!viewport)
        return;
    const scrolls = Math.floor(Math.random() * 3) + 1; // 1-3 scrolls
    for (let i = 0; i < scrolls; i++) {
        const scrollAmount = Math.random() * 500 + 300; // 300-800px
        await page.evaluate((amount) => {
            window.scrollBy(0, amount);
        }, scrollAmount);
        await humanDelay();
    }
}
// Set Korean locale and timezone
async function setKoreanEnvironment(page) {
    await page.evaluateOnNewDocument(() => {
        // Override timezone to Korea
        Object.defineProperty(Intl, 'DateTimeFormat', {
            value: class extends Intl.DateTimeFormat {
                constructor(locales, options) {
                    super(locales, { ...options, timeZone: 'Asia/Seoul' });
                }
            }
        });
        // Override language
        Object.defineProperty(navigator, 'language', {
            get: () => 'ko-KR'
        });
        Object.defineProperty(navigator, 'languages', {
            get: () => ['ko-KR', 'ko', 'en-US', 'en']
        });
        // Override geolocation
        Object.defineProperty(navigator, 'geolocation', {
            value: {
                getCurrentPosition: (success) => success({
                    coords: {
                        latitude: 37.5665, // Seoul coordinates
                        longitude: 126.9780,
                        accuracy: 50
                    }
                }),
                watchPosition: () => 1,
                clearWatch: () => { }
            }
        });
    });
}
export async function createStealthPage() {
    const browser = await getBrowser();
    const page = await browser.newPage();
    // Random Korean viewport
    const viewport = VIEWPORT_SIZES[Math.floor(Math.random() * VIEWPORT_SIZES.length)];
    await page.setViewport(viewport);
    // Korean user agent
    const userAgent = new UserAgent({ deviceCategory: 'desktop' });
    const koreanUserAgent = userAgent.toString();
    await page.setUserAgent(koreanUserAgent);
    // Set proxy authentication
    if (USE_PROXY) {
        try {
            await page.authenticate({
                username: PROXY_USERNAME,
                password: PROXY_PASSWORD
            });
        }
        catch (error) {
            console.error("❌ Proxy auth failed:", error);
        }
    }
    // Advanced stealth measures
    await setKoreanEnvironment(page);
    await page.evaluateOnNewDocument(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        // Override permissions
        Object.defineProperty(navigator, 'permissions', {
            value: {
                query: () => Promise.resolve({ state: 'granted' })
            }
        });
        // Override plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                { name: 'Native Client', filename: 'internal-nacl-plugin' }
            ]
        });
        // Override mimeTypes
        Object.defineProperty(navigator, 'mimeTypes', {
            value: [
                { type: 'application/pdf', suffixes: 'pdf' },
                { type: 'text/pdf', suffixes: 'pdf' }
            ]
        });
        // Mock Chrome properties
        window.chrome = {
            runtime: {
                connect: () => ({}),
                sendMessage: () => ({}),
                onConnect: {
                    addListener: () => ({})
                },
                onMessage: {
                    addListener: () => ({})
                }
            },
            loadTimes: () => ({}),
            csi: () => ({}),
            app: {
                isInstalled: false
            }
        };
        // Override console.debug to hide automation logs
        const originalDebug = console.debug;
        console.debug = function () {
            const args = Array.from(arguments);
            const message = args.join(' ');
            if (message.includes('puppeteer') || message.includes('automation')) {
                return;
            }
            originalDebug.apply(console, args);
        };
    });
    // Set Korean headers
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'DNT': '1' // Do Not Track
    });
    // Set Korean cookies before navigation
    await page.setCookie(...KOREAN_COOKIES);
    // Smart request interception
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const resourceType = req.resourceType();
        const url = req.url();
        // Block tracking and analytics
        if (url.includes('google-analytics') ||
            url.includes('doubleclick') ||
            url.includes('facebook.com/tr') ||
            url.includes('connect.facebook.net') ||
            url.includes('googlesyndication') ||
            url.includes('googleadservices')) {
            req.abort();
            return;
        }
        // Block unnecessary resources for speed
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            // Allow some images for natural appearance
            if (resourceType === 'image' && Math.random() > 0.3) {
                req.abort();
                return;
            }
            req.abort();
            return;
        }
        req.continue();
    });
    // Handle dialog boxes naturally
    page.on('dialog', async (dialog) => {
        console.log(`🗨️ Dialog: ${dialog.message()}`);
        await dialog.dismiss();
    });
    return page;
}
export async function humanBehaviorFlow(page) {
    console.log("🧠 Simulating human behavior...");
    // Random initial delay
    await humanDelay();
    // Human mouse movements
    await humanMouseMovement(page);
    // Human scrolling
    await humanScroll(page);
    // Random click somewhere (not on links)
    const viewport = await page.viewport();
    if (viewport) {
        await page.mouse.click(Math.random() * viewport.width * 0.8 + viewport.width * 0.1, Math.random() * viewport.height * 0.8 + viewport.height * 0.1, { delay: Math.random() * 100 + 50 });
    }
    await humanDelay();
}
export async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}
export async function testProxy() {
    try {
        console.log("🔍 Testing Korean proxy connection...");
        const page = await createStealthPage();
        // Test with Naver first
        await page.goto('https://www.naver.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        const title = await page.title();
        console.log("✅ Korean proxy test successful. Title:", title);
        // Check if we're in Korea by IP
        await page.goto('https://httpbin.org/ip', {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });
        const ipInfo = await page.evaluate(() => document.body.textContent);
        console.log("🌐 IP Info:", ipInfo);
        await page.close();
        return true;
    }
    catch (error) {
        console.error('❌ Proxy test failed:', error.message);
        return false;
    }
}
