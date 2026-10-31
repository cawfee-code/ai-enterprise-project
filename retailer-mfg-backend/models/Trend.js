const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema({
    source: { type: String, required: true, index: true }, 
    hashtag: { type: String, required: true, index: true },
    volume: { type: Number },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: '30d' // TTL Index: Auto-deletes after 30 days
    }
}, { strict: false }); 

module.exports = mongoose.model('Trend', trendSchema);