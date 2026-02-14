import { Router } from "express";
const router = Router();
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats
} from "../controllers/order.js";

router.route("/").post(createOrder).get(getOrders);
router.route("/stats").get(getOrderStats);
router
  .route("/:id")
  .get(getOrderById)
  .delete(deleteOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/payment", updatePaymentStatus);

export default router;
