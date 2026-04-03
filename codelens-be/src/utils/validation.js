var Ajv = require('ajv');
const ErrorResp = require('./ErrorResp');
var ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true });

const validateSchema = function (schema, data) {
  const validate = ajv.compile(schema);
  const isValid = validate(data);

  if (!isValid) {
    const errors = validate.errors.map(
      (err) =>
        `${err.dataPath || 'Request'} ${err.message} ${
          err.keyword == 'additionalProperties'
            ? err.params.additionalProperty
            : ''
        }`
    );
    throw new ErrorResp('Validation failed', errors.join('; '), 400);
  }
  return true;
};

module.exports = {
  validateSchema,
};
