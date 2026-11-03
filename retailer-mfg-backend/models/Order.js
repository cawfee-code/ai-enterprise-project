const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    retailerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    quantity: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending' // Every new order starts as pending
    },
    shippingCost: { type: Number, default: 0 } // Estimated from real hub-to-hub distance
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);