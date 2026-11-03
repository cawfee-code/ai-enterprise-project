const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');

module.exports = (verifyRole) => {
    const router = express.Router();

    // Orders for this manufacturer's own products, currently in the active production queue
    router.get('/', verifyRole('manufacturer'), async (req, res) => {
        try {
            const orders = await Order.aggregate([
                { $match: { status: { $in: ['pending', 'processing'] } } },
                { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'productInfo' } },
                { $unwind: '$productInfo' },
                { $match: { 'productInfo.manufacturerId': new mongoose.Types.ObjectId(req.user.userId) } },
                { $lookup: { from: 'users', localField: 'retailerId', foreignField: '_id', as: 'retailerInfo' } },
                { $unwind: '$retailerInfo' },
                {
                    $project: {
                        _id: 1,
                        quantity: 1,
                        status: 1,
                        createdAt: 1,
                        productName: '$productInfo.name',
                        retailerEmail: '$retailerInfo.email'
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);
            res.status(200).json({ data: orders });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch production queue orders: ' + error.message });
        }
    });

    // Moves an order between Kanban columns (Pending <-> Printed)
    router.patch('/:id/status', verifyRole('manufacturer'), async (req, res) => {
        try {
            const { status } = req.body;
            const allowedStatuses = ['pending', 'processing'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
            }

            const order = await Order.findById(req.params.id).populate('productId');
            if (!order) return res.status(404).json({ error: 'Order not found' });
            if (!order.productId || order.productId.manufacturerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'You can only update orders for your own products' });
            }

            order.status = status;
            await order.save();
            res.status(200).json({ message: 'Order status updated', order });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update order status: ' + error.message });
        }
    });

    return router;
};