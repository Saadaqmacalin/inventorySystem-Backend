import { Router } from "express";
const router = Router();
import {
  generateSalesReport,
  generateInventoryReport,
  generateFinancialReport,
  generateCustomerReport,
  generateOrderReport
} from "../controllers/reports.js";

router.get("/sales", generateSalesReport);
router.get("/inventory", generateInventoryReport);
router.get("/financial", generateFinancialReport);
router.get("/customer", generateCustomerReport);
router.get("/order", generateOrderReport);

export default router;
