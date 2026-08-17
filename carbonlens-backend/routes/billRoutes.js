const express = require('express');
const { uploadBill, getBillHistory, getBillById } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('bill'), uploadBill);
router.get('/history', getBillHistory);
router.get('/:id', getBillById);

module.exports = router;
