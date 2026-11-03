const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const RetailerSettings = require('../models/RetailerSettings');

// Uses current product price — Order schema has no price-at-purchase field.
module.exports = (verifyRole) => {
    const router = express.Router();

    router.get('/', verifyRole('retailer'), async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            // Aggregation $match does not auto-cast strings to ObjectId the way Mongoose's
            // find() does, so req.user.userId (a plain string from the JWT) has to be wrapped
            // explicitly here, or this match silently excludes every order.
            const matchStage = {
                retailerId: new mongoose.Types.ObjectId(req.user.userId),
                status: { $ne: 'cancelled' }
            };

            if (startDate || endDate) {
                matchStage.createdAt = {};
                if (startDate) matchStage.createdAt.$gte = new Date(startDate);
                if (endDate) {
                    const endOfDay = new Date(endDate);
                    endOfDay.setUTCHours(23, 59, 59, 999);
                    matchStage.createdAt.$lte = endOfDay;
                }
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

            // Pull the retailer's own target profit % from their Pricing Settings page, and use it
            // to project the profit they'd make reselling at that margin on top of what they paid
            // (originalPrice = totalSpend, the wholesale cost). profit = originalPrice * margin%,
            // sellingPrice = originalPrice + profit (what the retailer would actually resell at).
            const settings = await RetailerSettings.findOne({ retailerId: req.user.userId });
            const targetProfitPercentage = settings ? settings.targetProfitPercentage : null;

            const timelineWithProfit = spendTimeline.map((row) => {
                const profit = targetProfitPercentage != null
                    ? parseFloat((row.totalSpend * (targetProfitPercentage / 100)).toFixed(2))
                    : null;
                return {
                    ...row,
                    originalPrice: row.totalSpend,
                    profit,
                    sellingPrice: profit != null ? parseFloat((row.totalSpend + profit).toFixed(2)) : null
                };
            });

            res.status(200).json({
                message: 'Retailer analytics aggregation complete',
                data: timelineWithProfit,
                targetProfitPercentage
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to aggregate retailer analytics: ' + error.message });
        }
    });

    return router;
};