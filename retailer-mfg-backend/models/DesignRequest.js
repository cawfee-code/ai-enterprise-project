const mongoose = require('mongoose');

// A retailer's request to have one of their own uploaded designs custom-made
// by a specific manufacturer. Reuses the same status lifecycle as Order
// (pending -> processing is the manufacturer's approval step, same as the
// existing Production Queue Kanban) so it can be merged into that same board.
const designRequestSchema = new mongoose.Schema({
    retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    designId: { type: mongoose.Schema.Types.ObjectId, ref: 'Design', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    note: { type: String, default: '' },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('DesignRequest', designRequestSchema);