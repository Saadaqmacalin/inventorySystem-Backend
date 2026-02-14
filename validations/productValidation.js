import Joi from "joi";

const productSchema = Joi.object({
  productName: Joi.string().trim().required().messages({
    "string.empty": "Product name is required",
  }),
  categoryId: Joi.string().required().messages({
    "string.empty": "Category ID is required",
  }),
  supplierId: Joi.string().required().messages({
    "string.empty": "Supplier ID is required",
  }),
  description: Joi.string().allow(""),
  price: Joi.number().required().messages({
    "number.base": "Price must be a number",
  }),
  costPrice: Joi.number().required().min(0.01).messages({
    "number.min": "Cost price must be greater than 0",
  }),
  quantity: Joi.number().default(0),
  status: Joi.string().valid("active", "inactive").default("active"),
}).custom((value, helpers) => {
  if (value.price <= value.costPrice) {
    return helpers.message("Price must be greater than cost price");
  }
  return value;
});

export { productSchema };
