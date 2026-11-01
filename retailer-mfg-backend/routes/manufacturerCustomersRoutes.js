const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');

module.exports = (verifyRole) => {
    const router = express.Router();

    router.get('/', verifyRole('manufacturer'), async (req, res) => {
        try {
            const { segment } = req.query;
            const page = Math.max(parseInt(req.query.page) || 1, 1);
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
            const skip = (page - 1) * limit;

            const basePipeline = [
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
                    // Only this manufacturer's own orders, excluding cancelled ones
                    $match: {
                        'productInfo.manufacturerId': new mongoose.Types.ObjectId(req.user.userId),
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    // Spend/order count computed ONLY from orders with this manufacturer —
                    // not the retailer's platform-wide aiCluster totals
                    $group: {
                        _id: '$retailerId',
                        spentWithYou: { $sum: { $multiply: ['$quantity', '$productInfo.price'] } },
                        ordersWithYou: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'retailer'
                    }
                },
                { $unwind: '$retailer' },
                {
                    $project: {
                        _id: '$retailer._id',
                        email: '$retailer.email',
                        // Computed platform-wide by the clustering engine, across ALL manufacturers —
                        // not specific to this manufacturer's relationship with the retailer
                        platformSegment: { $ifNull: ['$retailer.aiCluster.segmentName', 'Unassigned'] },
                        spentWithYou: 1,
                        ordersWithYou: 1
                    }
                }
            ];

            if (segment) {
                basePipeline.push({ $match: { platformSegment: segment } });
            }

            basePipeline.push({ $sort: { spentWithYou: -1 } });

            const [customers, totalResult] = await Promise.all([
                Order.aggregate([...basePipeline, { $skip: skip }, { $limit: limit }]),
                Order.aggregate([...basePipeline, { $count: 'total' }])
            ]);

            res.status(200).json({
                data: customers,
                page,
                limit,
                total: totalResult[0]?.total || 0
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch manufacturer customer list: ' + error.message });
        }
    });

    return router;
};