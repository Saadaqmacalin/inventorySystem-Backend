import { Router } from "express";
const router = Router();
import {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.js";
import validate from "../middlewares/validationMiddleware.js";
import { customerSchema } from "../validations/customerValidation.js";

router.route("/")
  .post(validate(customerSchema), addCustomer)
  .get(getCustomers);

router
  .route("/:id")
  .get(getCustomerById)
  .patch(updateCustomer)
  .delete(deleteCustomer);

export default router;
