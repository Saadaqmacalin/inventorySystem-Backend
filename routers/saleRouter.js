import { Router } from "express";
const router = Router();
import {
  addSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
} from "../controllers/sale.js";
import validate from "../middlewares/validationMiddleware.js";
import { saleSchema } from "../validations/saleValidation.js";

router.route("/")
  .post(validate(saleSchema), addSale)
  .get(getSales);

router
  .route("/:id")
  .get(getSaleById)
  .patch(updateSale)
  .delete(deleteSale);

export default router;
