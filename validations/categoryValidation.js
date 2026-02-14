import Joi from "joi";

const categorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Name is required",
  }),
  description: Joi.string().allow("").optional(),
});

export { categorySchema };
