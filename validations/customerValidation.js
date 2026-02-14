import Joi from "joi";

const customerSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Customer name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
  }),
  password: Joi.string().min(6).optional().messages({
    "string.min": "Password must be at least 6 characters",
  }),
  phone: Joi.string().required().messages({
    "string.empty": "Phone number is required",
  }),
  address: Joi.object({
    street: Joi.string().optional().allow(""),
    city: Joi.string().optional().allow(""),
    state: Joi.string().optional().allow(""),
    zipCode: Joi.string().optional().allow(""),
    country: Joi.string().optional().allow(""),
  }).optional(),
  status: Joi.string().valid("Active", "Inactive").optional()
});

export { customerSchema };
