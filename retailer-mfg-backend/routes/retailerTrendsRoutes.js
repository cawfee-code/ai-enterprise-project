const express = require('express');
const Trend = require('../models/Trend');

module.exports = (verifyRole, cacheClient) => {
    const router = express.Router();

    // FEATURE 5 (Retailer): primary backend REST API that queries the trend
    // cache/database and serves it to the Retailer UI.
    router.get('/', verifyRole('retailer'), async (req, res) => {
        try {
            const cachedTrends = await cacheClient.get('trends_cache');
            if (cachedTrends) {
                return res.status(200).json({ source: 'Redis RAM', data: JSON.parse(cachedTrends) });
            }

            const dbTrends = await Trend.find().sort({ volume: -1 }).limit(100);
            await cacheClient.set('trends_cache', JSON.stringify(dbTrends), 'EX', 3600);

            res.status(200).json({ source: 'MongoDB', data: dbTrends });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};