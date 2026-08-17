const Bill = require('../models/Bill');
const User = require('../models/User');

const getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthBills = await Bill.find({
      user: userId,
      createdAt: { $gte: startOfMonth }
    });

    const totalCO2ThisMonth = thisMonthBills.reduce((sum, b) => sum + b.co2Emitted, 0);
    const totalBills = await Bill.countDocuments({ user: userId });

    let emissionStatus = 'Low';
    if (totalCO2ThisMonth > 300) emissionStatus = 'High';
    else if (totalCO2ThisMonth > 100) emissionStatus = 'Medium';

    const user = await User.findById(userId);

    res.json({
      totalCO2ThisMonth: parseFloat(totalCO2ThisMonth.toFixed(2)),
      totalBills,
      emissionStatus,
      greenCoins: user.greenCoins,
      badge: user.badge,
      consecutiveLowEmissions: user.consecutiveLowEmissions
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Summary failed' });
  }
};

const getTrend = async (req, res) => {
  try {
    const userId = req.user._id;
    const bills = await Bill.find({ user: userId }).sort({ createdAt: 1 });

    const byMonth = {};
    for (const b of bills) {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = 0;
      byMonth[key] += b.co2Emitted;
    }

    const labels = Object.keys(byMonth).sort();
    const data = labels.map((k) => parseFloat(byMonth[k].toFixed(2)));

    res.json({ labels, data });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Trend failed' });
  }
};

const getBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    const agg = await Bill.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$billType',
          totalCO2: { $sum: '$co2Emitted' },
          count: { $sum: 1 }
        }
      }
    ]);

    const items = agg.map((row) => {
      const net = parseFloat(row.totalCO2.toFixed(2));
      return {
        name: row._id,
        value: net,
        count: row.count,
        kind: net < 0 ? 'avoidance' : 'emission'
      };
    });

    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Breakdown failed' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const me = req.user._id;
    const topUsers = await User.find()
      .sort({ greenCoins: -1 })
      .limit(10)
      .select('name greenCoins badge');

    const leaderboard = topUsers.map((user, index) => {
      const isYou = user._id.equals(me);
      return {
        rank: index + 1,
        userId: user._id,
        name: isYou ? user.name.trim() : user.name.split(' ')[0],
        greenCoins: user.greenCoins,
        badge: user.badge,
        isYou
      };
    });

    res.json(leaderboard);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Leaderboard failed' });
  }
};

module.exports = { getSummary, getTrend, getBreakdown, getLeaderboard };
