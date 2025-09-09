import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Cart Agent backend running 🚀" });
});

// Example API route
app.get("/hello", (req, res) => {
  res.json({ msg: "Hello from Cart Agent!" });
});

// IMPORTANT: don't call app.listen()
// Bootstrapper will attach this app.
export default app;
