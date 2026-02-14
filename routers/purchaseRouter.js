import { Router } from "express";
const router = Router();
import {
  addPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} from "../controllers/purchase.js";
import validate from "../middlewares/validationMiddleware.js";
import { purchaseSchema } from "../validations/purchaseValidation.js";

router.route("/")
  .post(validate(purchaseSchema), addPurchase)
  .get(getPurchases);

router
  .route("/:id")
  .get(getPurchaseById)
  .patch(updatePurchase)
  .delete(deletePurchase);

export default router;
