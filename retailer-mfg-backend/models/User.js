const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['retailer', 'manufacturer'], // Strict architectural constraint
        required: true
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