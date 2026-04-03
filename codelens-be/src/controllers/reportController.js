const reportService = require('../services/reportService.js');

async function fetchAllReportCodeLines(req, res, next) {
  try {
    req?.log?.info({ reqParams: req.params }, 'reportController: fetchAllReportCodeLines - Request params');

    const result = await reportService.fetchAllReportCodeLines(req);
    res.send(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  fetchAllReportCodeLines,
};
