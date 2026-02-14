import { Router } from "express";
const router = Router();

import {
  addCategory,
  getAllCategories,
  getaSingleCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.js";
import validate from "../middlewares/validationMiddleware.js";
import { categorySchema } from "../validations/categoryValidation.js";

router.route("/")
  .post(validate(categorySchema), addCategory)
  .get(getAllCategories);

router
  .route("/:id")
  .get(getaSingleCategory)
  .patch(updateCategory)
  .delete(deleteCategory);

export default router;
