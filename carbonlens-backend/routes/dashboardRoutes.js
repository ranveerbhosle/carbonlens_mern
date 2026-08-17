const express = require('express');
const {
  getSummary,
  getTrend,
  getBreakdown,
  getLeaderboard
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/trend', getTrend);
router.get('/breakdown', getBreakdown);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
