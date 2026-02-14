import { Router } from "express";
const router = Router();

import {
  addProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/products.js";
import validate from "../middlewares/validationMiddleware.js";
import { productSchema } from "../validations/productValidation.js";

router.route("/")
  .post(validate(productSchema), addProduct)
  .get(getProducts);

router
  .route("/:id")
  .get(getSingleProduct)
  .patch(updateProduct) // Partial updates might need a different schema or logic, keeping as is for now but usually validation should be applied.
  .delete(deleteProduct);

export default router;
