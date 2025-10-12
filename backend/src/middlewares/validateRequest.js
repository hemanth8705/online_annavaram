function validateRequest(validator) {
  return (req, _res, next) => {
    const { error, value } = validator(req);
    if (error) {
      const err = new Error('Validation failed');
      err.status = 400;
      err.details = error;
      throw err;
    }

    Object.assign(req, value);
    next();
  };
}

function buildBodyValidator(schema) {
  return (req) => {
    const result = {};
    const errorDetails = {};

    Object.entries(schema).forEach(([field, rules]) => {
      const rawValue = req.body[field];

      if (rawValue === undefined || rawValue === null) {
        if (rules.required) {
          errorDetails[field] = 'Field is required';
        }
        return;
      }

      let value = rawValue;
      if (rules.transform) {
        value = rules.transform(value);
      }

      if (rules.type && typeof value !== rules.type) {
        errorDetails[field] = `Expected ${rules.type}`;
        return;
      }

      if (rules.validate) {
        const validationMessage = rules.validate(value);
        if (validationMessage) {
          errorDetails[field] = validationMessage;
          return;
        }
      }

      result[field] = value;
    });

    const hasErrors = Object.keys(errorDetails).length > 0;

    if (hasErrors) {
      return { error: errorDetails };
    }

    return { value: { body: result } };
  };
}

module.exports = {
  validateRequest,
  buildBodyValidator,
};
