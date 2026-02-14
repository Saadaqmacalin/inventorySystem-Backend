import Joi from "joi";

const purchaseSchema = Joi.object({
  supplierId: Joi.string().required().messages({
    "string.empty": "Supplier ID is required",
  }),
  productId: Joi.string().required().messages({
    "string.empty": "Product ID is required",
  }),
  quantity: Joi.number().min(1).required().messages({
    "number.min": "Quantity must be at least 1",
  }),
  unitCost: Joi.number().required().messages({
    "number.base": "Unit Cost must be a number",
  }),
  status: Joi.string().valid("Pending", "Received", "Cancelled").default("Pending"),
  refNo: Joi.string().optional()
});

export { purchaseSchema };
