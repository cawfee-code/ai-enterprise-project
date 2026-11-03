const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['retailer', 'manufacturer'], // Strict architectural constraint
        required: true
    },
    businessName: { type: String, trim: true }, // Manufacturer's display name shown to retailers on the product catalog

    // --- FEATURE 7: AI Customer Segmentation Fields ---
    aiCluster: {
        clusterId: { 
            type: Number, 
            default: null,
            index: true // Indexed for faster querying and filtering by Priyanka's CRM tables
        },
        segmentName: { 
            type: String, 
            enum: ['VIP', 'Regular', 'Churn Risk', 'Unassigned'], 
            default: 'Unassigned' 
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        orderFrequency: {
            type: Number,
            default: 0
        }
    }
});

// Middleware to hash the password before saving
userSchema.pre('save', async function() {
    // Only hash if the password has been modified (or is new)
    if (!this.isModified('password')) return;
    
    // Generate a secure salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);