const express = require('express');
const router = express.Router();
const redirectController = require('../../controllers/redirectController.js');


router.get("/compliance", redirectController.redirectToCompliance);
router.get("/owasp", redirectController.redirectToOwasp);

module.exports = router;