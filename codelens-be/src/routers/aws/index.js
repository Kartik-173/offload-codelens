const express = require('express');
const router = express.Router();
const awsAlbController = require('../../controllers/awsAlbController');

// Get all ALBs with their target groups
router.post('/albs', awsAlbController.getAlbs);

// Deregister a target from a target group
router.post('/deregister-target', awsAlbController.deregisterTarget);

// Get detailed unhealthy target information
router.post('/unhealthy-target-details', awsAlbController.getUnhealthyTargetDetails);

// Terminate an EC2 instance
router.post('/terminate-instance', awsAlbController.terminateInstance);

module.exports = router;
