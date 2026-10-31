const mongoose = require('mongoose');

const retailerSettingsSchema = new mongoose.Schema({
    retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    targetProfitPercentage: { type: Number, required: true, min: 0, max: 100 }
}, { timestamps: true });

module.exports = mongoose.model('RetailerSettings', retailerSettingsSchema);