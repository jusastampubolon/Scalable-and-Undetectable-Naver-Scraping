import { getBrowser } from "../utils/browser.js";

export async function scrapeNaver(query, page = 1) {
  const browser = await getBrowser();
  const pageInstance = await browser.newPage();

  const url = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(query)}&pagingIndex=${page}&pagingSize=40`;

  console.log("🔍 Opening:", url);
  await pageInstance.goto(url, { waitUntil: "networkidle2" });

  // Wait for product cards
  await pageInstance.waitForSelector("div.product_info_area, div.basicList_info_area", {
    timeout: 10000,
  });

  const products = await pageInstance.evaluate(() => {
    const items = [];

    document.querySelectorAll("div.product_info_area, div.basicList_info_area").forEach((card) => {
      const name = card.querySelector("a > div > span, a.basicList_link__JLQJf")?.innerText || null;
      const price = card.querySelector(".price_num__S2p_v, .price_real__Jc6pH")?.innerText || null;
      const shop = card.querySelector(".product_mall__B-7YE, .basicList_mall__BC5xu")?.innerText || null;
      const link = card.querySelector("a")?.href || null;

      items.push({ name, price, shop, link });
    });

    return items;
  });

  await pageInstance.close();
  return products;
}
