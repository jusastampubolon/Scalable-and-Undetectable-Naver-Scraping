import { createStealthPage, testProxy, humanBehaviorFlow } from "../utils/browser.js";
import { Page } from "puppeteer";

interface Product {
  title: string;
  price: string;
  shop: string;
  link: string;
  image?: string;
  rating?: string;
  reviewCount?: string;
}

interface ScrapeResult {
  success: boolean;
  data?: Product[];
  error?: string;
  executionTime?: number;
  humanized?: boolean;
  proxyUsed?: boolean;
}

// Human-like random delays with variation
const humanDelay = (min: number = 1000, max: number = 3000) => 
  new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

// Random browsing pattern
async function simulateBrowsingBehavior(page: Page) {
  console.log("🧠 Simulating Korean user browsing pattern...");
  
  // Initial page load behavior
  await humanDelay(2000, 4000);
  
  // Scroll through page naturally
  const scrollSteps = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < scrollSteps; i++) {
    const scrollDistance = Math.random() * 600 + 400;
    await page.evaluate((distance) => {
      window.scrollBy(0, distance);
    }, scrollDistance);
    
    await humanDelay(800, 1500);
    
    // Occasionally move mouse
    if (Math.random() > 0.7) {
      const viewport = await page.viewport();
      if (viewport) {
        await page.mouse.move(
          Math.random() * viewport.width,
          Math.random() * viewport.height,
          { steps: Math.floor(Math.random() * 8) + 3 }
        );
      }
    }
  }
  
  // Random pause as if reading
  await humanDelay(1000, 2500);
}

export async function checkProxyStatus(): Promise<boolean> {
  console.log('🔄 Testing Korean proxy and browser setup...');
  return await testProxy();
}

export async function scrapeNaver(query: string, pageIndex: number = 1): Promise<ScrapeResult> {
  const startTime = Date.now();
  let page: Page | null = null;

  try {
    console.log(`🔍 Starting HUMANIZED scrape for: "${query}" page ${pageIndex}`);
    console.log("🇰🇷 Using Korean proxy, cookies, and behavior patterns");
    
    // Test setup first
    const setupWorking = await checkProxyStatus();
    if (!setupWorking) {
      return {
        success: false,
        error: "Korean proxy setup failed",
        executionTime: Date.now() - startTime,
        humanized: false,
        proxyUsed: true
      };
    }
    
    page = await createStealthPage();
    
    const url = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(query)}&pagingIndex=${pageIndex}&pagingSize=40`;
    
    console.log("🌐 Navigating to Naver Shopping...");
    
    // Human-like navigation with delays
    await humanDelay(1000, 2000);
    
    await page.goto(url, { 
      waitUntil: "networkidle2", 
      timeout: 45000 
    });

    // Check for blocks or captcha
    const pageTitle = await page.title();
    const pageContent = await page.content();
    
    if (pageTitle.includes("접근") || pageTitle.includes("차단") || 
        pageContent.includes("captcha") || pageContent.includes("robot")) {
      throw new Error("Access blocked - possible bot detection");
    }

    console.log("✅ Page loaded successfully");
    
    // Simulate human browsing behavior
    await simulateBrowsingBehavior(page);
    
    // Wait for products to load naturally
    await humanDelay(2000, 3500);

    // Multiple selector strategies for robustness
    const selectors = [
      "div[class*='basicList_info_area']",
      "[data-nclick*='lst']",
      ".basicList_info_area__17Xyo",
      "div.basicList_item__2XT81",
      "li[class*='basicList_item']"
    ];

    let productSelector = null;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 8000 });
        productSelector = selector;
        console.log(`🎯 Found products with selector: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }

    if (!productSelector) {
      // Take screenshot for debugging
      await page.screenshot({ path: `debug_${Date.now()}.png` });
      throw new Error("No product selectors found - Naver layout may have changed");
    }

    // Additional human delay before extraction
    await humanDelay(1000, 2000);

    // Extract products with simpler approach
    const productElements = await page.$$(productSelector);
    const products: Product[] = [];

    for (let i = 0; i < Math.min(productElements.length, 40); i++) {
      try {
        const el = productElements[i];
        
        // Extract data using multiple selector strategies
        const titleEl = await el.$("a[class*='basicList_link'], a[class*='product_link']");
        const priceEl = await el.$("span[class*='price_num'], span[class*='price'], strong[class*='price']");
        const shopEl = await el.$("a[class*='basicList_mall'], div[class*='mall'] a, span[class*='mall_name']");
        
        const title = await titleEl?.evaluate(node => node.textContent?.trim().replace(/\s+/g, ' ')) || "";
        const price = await priceEl?.evaluate(node => node.textContent?.trim()) || "";
        const shop = await shopEl?.evaluate(node => node.textContent?.trim()) || "쇼핑몰";
        const link = await titleEl?.evaluate(node => node.getAttribute("href")) || "#";

        // Skip invalid products
        if (!title || title === "상품명" || !price) {
          continue;
        }

        // Extract image
        const imageEl = await el.$("img[class*='thumbnail'], img[class*='product']");
        const image = await imageEl?.evaluate(node => node.getAttribute("src") || node.getAttribute("data-src")) || "";

        // Extract rating and reviews
        const ratingEl = await el.$("span[class*='rating'], em[class*='rating']");
        const reviewEl = await el.$("span[class*='review'], em[class*='review']");
        
        const rating = await ratingEl?.evaluate(node => node.textContent?.trim()) || "";
        const reviewCount = await reviewEl?.evaluate(node => node.textContent?.trim()) || "";

        products.push({
          title,
          price,
          shop,
          link: link.startsWith("http") ? link : `https://search.shopping.naver.com${link}`,
          image,
          rating,
          reviewCount
        });

      } catch (error) {
        console.error(`Error extracting product ${i}:`, error);
        continue;
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ Successfully scraped ${products.length} Korean products in ${executionTime}ms`);
    console.log(`🧠 Human behavior simulation: COMPLETE`);
    console.log(`🇰🇷 Appearing as Korean user from proxy`);

    return {
      success: true,
      data: products,
      executionTime,
      humanized: true,
      proxyUsed: true
    };

  } catch (error: any) {
    console.error("❌ Humanized scrape failed:", error.message);
    
    // Take screenshot on error
    if (page) {
      try {
        await page.screenshot({ path: `error_${Date.now()}.png` });
        console.log("📸 Screenshot saved for debugging");
      } catch (e) {
        console.error("Could not take screenshot:", e);
      }
    }
    
    return {
      success: false,
      error: `Humanized scrape failed: ${error.message}`,
      executionTime: Date.now() - startTime,
      humanized: true,
      proxyUsed: true
    };
  } finally {
    if (page && !page.isClosed()) {
      await page.close();
      console.log("🔌 Page closed");
    }
  }
}