const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');

module.exports = (verifyRole) => {
    const router = express.Router();

    router.get('/', verifyRole('manufacturer'), async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            const matchStage = { status: { $ne: 'cancelled' } };
            if (startDate || endDate) {
                matchStage.createdAt = {};
                if (startDate) matchStage.createdAt.$gte = new Date(startDate);
                if (endDate) {
                    // A plain date like "2026-11-04" parses as midnight UTC, which would cut the
                    // range off at the very start of the end date instead of including it.
                    // Push it to the last instant of that day so the end date is fully included.
                    const endOfDay = new Date(endDate);
                    endOfDay.setUTCHours(23, 59, 59, 999);
                    matchStage.createdAt.$lte = endOfDay;
                }
            }

            const revenueTimeline = await Order.aggregate([
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
                { $match: { 'productInfo.manufacturerId': new mongoose.Types.ObjectId(req.user.userId) } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        totalRevenue: { $sum: { $multiply: ['$quantity', '$productInfo.price'] } },
                        ordersCount: { $sum: 1 },
                        unitsSold: { $sum: '$quantity' }
                    }
                },
                { $sort: { _id: 1 } },
                {
                    $project: {
                        date: '$_id',
                        totalRevenue: 1,
                        ordersCount: 1,
                        unitsSold: 1,
                        _id: 0
                    }
                }
            ]);

            res.status(200).json({ message: 'Manufacturer analytics aggregation complete', data: revenueTimeline });
        } catch (error) {
            res.status(500).json({ error: 'Failed to aggregate manufacturer analytics: ' + error.message });
        }
    });

    return router;
};