const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema({
    source: { type: String, required: true, index: true }, 
    hashtag: { type: String, required: true, index: true },
    volume: { type: Number },
    
    // Feature 6: NLP Sentiment Appended Fields
    sentiment: {
        score: { type: String, enum: ['Positive', 'Neutral', 'Negative'] },
        confidence: { type: Number, min: 0, max: 1 }
    },

    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: '30d' 
    }
}, { strict: false }); 

module.exports = mongoose.model('Trend', trendSchema);