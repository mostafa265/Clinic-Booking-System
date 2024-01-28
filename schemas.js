const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

// Sanitizing HTML w/ JOI
const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTages: [],
          allowedAttributes: {},
        });
        if (clean !== value) {
          return helpers.error("string.escapeHTML", { value });
        }
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);

const PatientSchema = Joi.object({
  name: Joi.string().required().escapeHTML(),
  age: Joi.number().required().min(1),
  gender: Joi.string().required().escapeHTML(),
  phoneNumber: Joi.number().required(),
  address: Joi.string().escapeHTML(),
}).required();

module.exports = { PatientSchema };
