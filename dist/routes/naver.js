import express from "express";
import { scrapeNaver, checkProxyStatus } from "../services/naverService.js";
const router = express.Router();
// GET /api/naver/proxy-status - Check proxy connection
router.get("/proxy-status", async (req, res) => {
    try {
        const proxyWorking = await checkProxyStatus();
        res.json({
            success: true,
            proxy: "network.mrproxy.com:10000",
            country: "Korea",
            status: proxyWorking ? "Connected" : "Failed",
            working: proxyWorking
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});
// GET /api/naver?q=query&page=1
router.get("/", async (req, res) => {
    try {
        const query = req.query.q || "아이폰";
        const page = parseInt(req.query.page || "1");
        const method = req.query.method || "browser";
        console.log(`📥 Request: ${query} page ${page} method ${method}`);
        console.log(`🛜 Proxy: network.mrproxy.com:10000`);
        // Hapus method API karena tidak ada function-nya
        // Selalu gunakan browser method dengan proxy
        const result = await scrapeNaver(query, page);
        if (result.success) {
            res.json({
                success: true,
                query,
                page,
                method: "browser",
                proxy: {
                    server: "network.mrproxy.com:10000",
                    country: "Korea",
                    used: result.proxyUsed
                },
                total: Array.isArray(result.data) ? result.data.length : 0,
                executionTime: result.executionTime,
                products: result.data,
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: result.error,
                executionTime: result.executionTime,
                proxyUsed: result.proxyUsed,
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (err) {
        console.error("❌ Route error:", err);
        res.status(500).json({
            success: false,
            error: "Failed to scrape Naver",
            details: err.message
        });
    }
});
// GET /api/naver/health
router.get("/health", async (req, res) => {
    res.json({
        status: "OK",
        service: "naver-scraper",
        proxy: "network.mrproxy.com:10000",
        timestamp: new Date().toISOString()
    });
});
export default router;
