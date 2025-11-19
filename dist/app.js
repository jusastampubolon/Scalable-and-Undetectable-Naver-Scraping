import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import naverRoute from "./routes/naver.js";
const app = express();
const PORT = process.env.PORT || 3000;
console.log("🔄 Initializing server...");
// Middleware
app.use(cors());
app.use(express.json());
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP",
});
app.use(limiter);
// Routes
app.use("/api/naver", naverRoute);
console.log("✅ Naver routes registered");
// Health check
app.get("/health", (req, res) => {
    console.log("✅ Health check called");
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        service: "naver-scraper-api"
    });
});
// 404 Handler YANG BENAR - tanpa path pattern
app.use((req, res, next) => {
    res.status(404).json({
        error: "Route not found",
        path: req.path,
        availableRoutes: [
            "GET /health",
            "GET /api/naver?q=query&page=1"
        ]
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔍 Naver API: http://localhost:${PORT}/api/naver`);
});
