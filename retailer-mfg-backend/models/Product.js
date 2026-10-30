const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, index: true },
    description: { type: String },
    designFileUrl: { type: String, default: null },
    
    // Feature 3: Dynamic Pricing & Cost Parameters
    baseManufacturingCost: { type: Number, required: true, min: 0 }, // Replaces "Print Cost"
    targetMarginPercentage: { type: Number, required: true, min: 0 }, 
    
    // Feature 3: Physical properties for the Graph Traversal Engine
    physicalWeightKg: { type: Number, required: true, min: 0 },
    dimensions: {
        lengthCm: { type: Number, required: true, min: 0 },
        widthCm: { type: Number, required: true, min: 0 },
        heightCm: { type: Number, required: true, min: 0 }
    },
    
    price: { type: Number, min: 0 }, // Will now be calculated dynamically
    stockCount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);