import "dotenv/config";

import cors from "cors";
import express from "express";
const app = express();

// Middlewares
import notFoundMiddleware from "./middlewares/notFound.js";
import errorHandlerMiddleware from "./middlewares/errorHandler.js";

// Routers
import userRouter from "./routers/userRoute.js";
import categoryRouter from "./routers/categoryRouter.js";
import productsRouters from "./routers/productsRouters.js";
import suppliersRouters from "./routers/suppliersRouters.js";
import customerRouter from "./routers/customerRouter.js";
import purchaseRouter from "./routers/purchaseRouter.js";
import saleRouter from "./routers/saleRouter.js";
import orderRouter from "./routers/orderRouter.js";
import reportsRouter from "./routers/reportsRouter.js";
import customerPortalRouter from "./routers/customerRouters.js";
import importRouter from "./routers/importRouter.js";
import connectDB from "./db/connectDB.js";

// Middleware configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productsRouters);
app.use("/api/suppliers", suppliersRouters);
app.use("/api/customers", customerRouter);
app.use("/api/purchases", purchaseRouter);
app.use("/api/sales", saleRouter);
app.use("/api/orders", orderRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/customer-portal", customerPortalRouter);
app.use("/api/import", importRouter);

// Error Handling Middlewares (Must be after routes)
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB(process.env.MONGO_URL);
    console.log("MongoDB connected successfully");
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
}

start();
