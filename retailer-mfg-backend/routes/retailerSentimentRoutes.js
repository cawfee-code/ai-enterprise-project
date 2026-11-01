const express = require('express');
const Trend = require('../models/Trend');

module.exports = (verifyRole) => {
    const router = express.Router();

    router.get('/', verifyRole('retailer'), async (req, res) => {
        try {
            const results = await Trend.aggregate([
                {
                    // Only trends with a valid sentiment label are counted
                    $match: {
                        'sentiment.score': { $in: ['Positive', 'Neutral', 'Negative'] }
                    }
                },
                {
                    $group: {
                        _id: '$sentiment.score',
                        count: { $sum: 1 },
                        totalVolume: { $sum: { $ifNull: ['$volume', 0] } },
                        confidenceSum: {
                            $sum: {
                                $cond: [{ $isNumber: '$sentiment.confidence' }, '$sentiment.confidence', 0]
                            }
                        },
                        confidenceCount: {
                            $sum: {
                                $cond: [{ $isNumber: '$sentiment.confidence' }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            const summary = {
                Positive: { count: 0, volume: 0 },
                Neutral: { count: 0, volume: 0 },
                Negative: { count: 0, volume: 0 }
            };

            let totalConfidenceSum = 0;
            let totalConfidenceCount = 0;

            results.forEach((r) => {
                if (summary.hasOwnProperty(r._id)) {
                    summary[r._id] = { count: r.count, volume: r.totalVolume };
                }
                // Only records with a valid numeric confidence contribute to the average
                totalConfidenceSum += r.confidenceSum;
                totalConfidenceCount += r.confidenceCount;
            });

            const data = {
                ...summary,
                avgConfidence: totalConfidenceCount > 0
                    ? Number((totalConfidenceSum / totalConfidenceCount).toFixed(2))
                    : null
            };

            res.status(200).json({ source: 'MongoDB', data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};