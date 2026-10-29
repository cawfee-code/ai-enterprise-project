const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    manufacturerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: { 
        type: String, 
        required: true,
        index: true
    },
    description: { 
        type: String 
    },
    price: { 
        type: Number, 
        required: true,
        min: 0
    },
    stockCount: { 
        type: Number, 
        required: true, 
        min: 0 // Prevents negative inventory
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('Product', productSchema);