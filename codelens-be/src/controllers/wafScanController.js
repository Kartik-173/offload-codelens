const wafScanService = require('../services/wafScanService.js');

async function startWafScan(req,res,next) {
    try {
        req?.log?.info({requestBody: req.body},'wafScanController: startWafScan request data');
        const result = await wafScanService.startWafScan(req);
        res.send({data: result});
    } catch (error) {
        next(error);
    }
}

async function listScans(req, res, next) {
    try {
        req?.log?.info(
            { requestQuery: req.query },
            "wafScanController: listScans request data"
        );
        const result = await wafScanService.list(req);
        res.send({ data: result });
    } catch (error) {
        next(error);
    }
}

async function getScanReport(req, res, next) {
    try {
        req?.log?.info(
            { requestQuery: req.query },
            "wafScanController: getScanReport request data"
        );
        const result = await wafScanService.getOne(req);
        res.send({ data: result });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    startWafScan,
    listScans,
    getScanReport
}