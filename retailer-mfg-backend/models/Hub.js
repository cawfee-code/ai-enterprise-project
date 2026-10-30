const mongoose = require('mongoose');

const hubSchema = new mongoose.Schema({
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    hubType: { 
        type: String, 
        enum: ['manufacturer_warehouse', 'retailer_qc_hub'], 
        required: true 
    },
    location: {
        type: {
            type: String, 
            enum: ['Point'], 
            required: true
        },
        coordinates: {
            type: [Number], // MongoDB requires [longitude, latitude] format
            required: true
        }
    },
    addressString: { type: String, required: true }
}, { timestamps: true });

// 2dsphere index enables fast spatial queries
hubSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hub', hubSchema);