const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    billType: {
      type: String,
      enum: ['Electricity', 'Petrol', 'Diesel', 'LPG', 'Restaurant', 'PublicTransport'],
      required: true
    },
    consumptionValue: { type: Number, required: true },
    consumptionUnit: { type: String, required: true },
    co2Emitted: { type: Number, required: true },
    emissionLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true
    },
    tip: { type: String },
    vegSpendInr: { type: Number },
    nonVegSpendInr: { type: Number },
    restaurantSplitMethod: {
      type: String,
      enum: ['sections', 'subtotal', 'blended_total']
    },
    coinsEarned: { type: Number, default: 0 },
    billDate: { type: Date, default: Date.now },
    filePath: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
