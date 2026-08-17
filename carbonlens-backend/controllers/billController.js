const Bill = require('../models/Bill');
const User = require('../models/User');
const { extractTextFromFile } = require('../services/ocrService');
const { calculateCarbon } = require('../services/carbonCalculatorService');
const { updateUserCoins } = require('../services/greenCoinsService');

const uploadBill = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { billType } = req.body;
    if (!billType) return res.status(400).json({ message: 'Bill type is required' });

    const filePath = req.file.path;
    const extractedText = await extractTextFromFile(filePath);
    const result = calculateCarbon(extractedText, billType);

    if (!result) {
      return res.status(422).json({
        message: 'Could not extract consumption data. Please upload a clearer image.'
      });
    }

    const user = await User.findById(req.user._id);
    const { coinsEarned, bonusMessage, penaltyMessage } = await updateUserCoins(user, result.emissionLevel);

    const bill = await Bill.create({
      user: req.user._id,
      billType,
      ...result,
      coinsEarned,
      filePath
    });

    res.status(201).json({
      bill,
      coinsEarned,
      bonusMessage,
      penaltyMessage,
      totalCoins: user.greenCoins,
      badge: user.badge
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Upload failed' });
  }
};

const getBillHistory = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (type) filter.billType = type;
    if (startDate && endDate) {
      filter.billDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bills = await Bill.find(filter).sort({ createdAt: -1 });
    res.json(bills);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch bills' });
  }
};

const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch bill' });
  }
};

module.exports = { uploadBill, getBillHistory, getBillById };
