import Joi from "joi";

const saleSchema = Joi.object({
  customerId: Joi.string().required().messages({
    "string.empty": "Customer ID is required",
  }),
  productId: Joi.string().required().messages({
    "string.empty": "Product ID is required",
  }),
  quantity: Joi.number().min(1).required().messages({
    "number.min": "Quantity must be at least 1",
  }),
  unitPrice: Joi.number().required().messages({
    "number.base": "Unit Price must be a number",
  }),
  status: Joi.string().valid("Pending", "Completed", "Cancelled").default("Pending"),
  invoiceNo: Joi.string().optional()
});

export { saleSchema };
