import { Router } from "express";
const router = Router();
import {
  addSuppliers,
  getSuppliers,
  getSupplierById,
  UpdateSupplier,
  deleteSupplier,
} from "../controllers/suppliers.js";
import validate from "../middlewares/validationMiddleware.js";
import { supplierSchema } from "../validations/supplierValidation.js";

router.route("/")
  .post(validate(supplierSchema), addSuppliers)
  .get(getSuppliers);

router
  .route("/:id")
  .get(getSupplierById)
  .patch(UpdateSupplier)
  .delete(deleteSupplier);

export default router;
