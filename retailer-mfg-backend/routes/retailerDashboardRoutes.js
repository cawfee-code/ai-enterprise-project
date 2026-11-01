const express = require('express');
const Order = require('../models/Order');

// Uses current product price — Order schema has no price-at-purchase field.
module.exports = (verifyRole) => {
    const router = express.Router();

    router.get('/', verifyRole('retailer'), async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            const matchStage = {
                retailerId: req.user.userId,
                status: { $ne: 'cancelled' }
            };

            if (startDate || endDate) {
                matchStage.createdAt = {};
                if (startDate) matchStage.createdAt.$gte = new Date(startDate);
                if (endDate) matchStage.createdAt.$lte = new Date(endDate);
            }

            const spendTimeline = await Order.aggregate([
                { $match: matchStage },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'productInfo'
                    }
                },
                { $unwind: '$productInfo' },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        // NOTE: uses CURRENT product price, not price-at-purchase-time
                        totalSpend: { $sum: { $multiply: ['$quantity', '$productInfo.price'] } },
                        ordersCount: { $sum: 1 },
                        unitsPurchased: { $sum: '$quantity' }
                    }
                },
                { $sort: { _id: 1 } },
                {
                    $project: {
                        date: '$_id',
                        totalSpend: 1,
                        ordersCount: 1,
                        unitsPurchased: 1,
                        _id: 0
                    }
                }
            ]);

            res.status(200).json({ message: 'Retailer analytics aggregation complete', data: spendTimeline });
        } catch (error) {
            res.status(500).json({ error: 'Failed to aggregate retailer analytics: ' + error.message });
        }
    });

    return router;
};