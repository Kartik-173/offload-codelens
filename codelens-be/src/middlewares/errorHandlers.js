const ErrorResp = require('../utils/ErrorResp');
const { ERROR_CODES, LOG_ERR_MSG } = require('../constants.js');

const errorResponse = function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ErrorResp) {
    req.log.error({ err }, LOG_ERR_MSG.HANDLED);
    return res.status(200).send({
      error: err,
    });
  }

  if (err.sql) {
    const sqlError = new ErrorResp(LOG_ERR_MSG.SQL, '', ERROR_CODES.SQL, err);
    req.log.error({ err: sqlError }, LOG_ERR_MSG.SQL);
    return res.status(200).send({ error: { message: 'Something went wrong, Please try again', detail: 'Something wrong with query', code: 500, }, });
  }

  return res.status(200).send({ error: { message: 'Something went wrong, Please try again', detail: 'Internal Server Error', code: 500 } });
};

module.exports = {
  errorResponse,
};
