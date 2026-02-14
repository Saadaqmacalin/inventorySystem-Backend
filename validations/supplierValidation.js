import Joi from "joi";

const supplierSchema = Joi.object({
  companyName: Joi.string().trim().required().messages({
    "string.empty": "Company name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
  }),
  phone: Joi.string().required().messages({
    "string.empty": "Phone number is required",
  }),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    zipCode: Joi.string().optional()
  }).unknown(true).optional(), // Allowing flexible address structure for now
  category: Joi.array().items(Joi.string()).required().messages({
    "array.base": "Category must be an array of strings",
    "any.required": "Category is required",
  }),
  status: Joi.string().valid("Active", "Inactive", "Pending", "Blacklisted").default("Active"),
});

export { supplierSchema };
