import express from "express";
import cors from "cors";
import naverRoutes from "./routes/naver.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/naver", naverRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
