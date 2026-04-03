const express = require('express');
const router = express.Router();
const {
  getUserTargetSelections,
  saveUserTargetSelections,
  addTargetToExcludedList,
  removeTargetFromExcludedList,
  getExcludedTargets,
  autoDeregisterUnhealthyTargets
} = require('../controllers/userTargetSelectionsController');

// GET /api/user/target-selections - Get user target selections
router.get('/target-selections', getUserTargetSelections);

// POST /api/user/target-selections - Save user target selections
router.post('/target-selections', saveUserTargetSelections);

// POST /api/user/exclude-target - Add target to excluded list
router.post('/exclude-target', addTargetToExcludedList);

// POST /api/user/remove-exclusion - Remove target from excluded list
router.post('/remove-exclusion', removeTargetFromExcludedList);

// GET /api/user/excluded-targets - Get all excluded targets for user
router.get('/excluded-targets', getExcludedTargets);

// POST /api/user/auto-deregister - Enhanced auto-deregister that respects exclusions
router.post('/auto-deregister', autoDeregisterUnhealthyTargets);

module.exports = router;
