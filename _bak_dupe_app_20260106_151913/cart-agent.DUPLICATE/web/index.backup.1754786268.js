import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { composeRecovery } from "./lib/composeRecoveryMessage.js";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

/** Healthcheck */
app.get("/health", (_req, res) => res.status(200).send("OK"));

/** Abandoned-Cart webhook receiver **/
app.post("/api/abandoned-cart", async (req, res) => {
  console.log("[abandoned-cart] got body:", JSON.stringify(req.body));
  try {
    const { checkoutId, email, lineItems, totalPrice } = req.body;

    // Persist
    const record = await prisma.abandonedCart.create({
      data: {
        checkoutId,
        email,
        lineItems,
        totalPrice: Number(totalPrice ?? 0),
      },
    });
    console.log("[abandoned-cart] saved:", record);

    // Generate high-converting follow-up copy
    const recovery = await composeRecovery({
      name: email,
      items: Array.isArray(lineItems) ? lineItems.map(li => li.title).filter(Boolean) : [],
      total: Number(totalPrice ?? 0),
      brand: "Cart Agent",
    });
    console.log("[abandoned-cart] recovery:", recovery);

    // Return both DB record and message so you can wire it up in UI later
    return res.status(201).json({ record, recovery });
  } catch (error) {
    console.error("❌ [abandoned-cart] error saving:", error?.message);
    console.error(error?.stack || error);
    return res.status(500).send("Internal Server Error");
  }
});

/** Local run (Shopify CLI will proxy to this) */
const PORT = process.env.PORT || 0; // 0 = random free port
app.listen(PORT, () => {
  const addr = app?.address?.() || {};
  const port = typeof addr === "object" && addr?.port ? addr.port : PORT || "(unknown)";
  console.log(`[local] webhook receiver listening at http://localhost:${port}`);
});

export default app;
