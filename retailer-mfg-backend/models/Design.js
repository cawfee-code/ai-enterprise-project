const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
    retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    designFileUrl: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Design', designSchema);