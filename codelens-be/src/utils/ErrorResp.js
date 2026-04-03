class ErrorResp extends Error {
  constructor(message, detail, code) {
    super();
    this.message = message || 'Something went wrong, Please try again';
    this.detail = detail || 'Internal Server Error';
    this.code = code || 500;
  }
}

module.exports = ErrorResp;
