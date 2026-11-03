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
    pincode: { type: String, required: true }, // used to geocode the hub's coordinates
    addressLine: { type: String, default: '' }, // optional free-text address (street, building, etc.)
    addressString: { type: String, required: true } // display label: addressLine if given, otherwise the pin code
}, { timestamps: true });

// 2dsphere index enables fast spatial queries
hubSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hub', hubSchema);