import express from "express";
import { scrapeNaver } from "../services/naverService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = req.query.q || "아이폰";
    const page = parseInt(req.query.page || "1");

    const data = await scrapeNaver(query, page);

    res.json({
      query,
      page,
      total: data.length,
      products: data,
    });
  } catch (err) {
    console.error("❌ Scrape error:", err);
    res.status(500).json({ error: "Failed to scrape Naver" });
  }
});

export default router;
