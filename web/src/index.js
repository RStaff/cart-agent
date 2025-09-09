import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ status: "ok", message: "Cart Agent backend running 🚀" }));
app.get("/hello", (_req, res) => res.json({ msg: "Hello from Cart Agent!" }));

export default app;
