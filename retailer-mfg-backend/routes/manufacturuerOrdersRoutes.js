const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const DesignRequest = require('../models/DesignRequest');

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
                        shippingCost: 1,
                        productName: '$productInfo.name',
                        retailerEmail: '$retailerInfo.email'
                    }
                }
            ]);
            const taggedOrders = orders.map((o) => ({ ...o, type: 'order' }));

            // Merge in pending/approved custom design requests sent to this manufacturer,
            // so the Kanban shows both regular product orders and custom requests in one board.
            const designRequests = await DesignRequest.find({
                manufacturerId: req.user.userId,
                status: { $in: ['pending', 'processing'] }
            })
                .populate('designId', 'name')
                .populate('retailerId', 'email');

            const taggedDesignRequests = designRequests.map((dr) => ({
                _id: dr._id,
                quantity: dr.quantity,
                status: dr.status,
                createdAt: dr.createdAt,
                shippingCost: 0,
                productName: dr.designId?.name ? `Custom design: ${dr.designId.name}` : 'Custom design request',
                retailerEmail: dr.retailerId?.email,
                note: dr.note,
                type: 'design_request'
            }));

            const combined = [...taggedOrders, ...taggedDesignRequests].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            res.status(200).json({ data: combined });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch production queue orders: ' + error.message });
        }
    });

    // Moves an order (or design request) between Kanban columns (Pending <-> Printed)
    router.patch('/:id/status', verifyRole('manufacturer'), async (req, res) => {
        try {
            const { status, type } = req.body;
            const allowedStatuses = ['pending', 'processing'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
            }

            if (type === 'design_request') {
                const designRequest = await DesignRequest.findById(req.params.id);
                if (!designRequest) return res.status(404).json({ error: 'Design request not found' });
                if (designRequest.manufacturerId.toString() !== req.user.userId) {
                    return res.status(403).json({ error: 'You can only update requests sent to you' });
                }
                designRequest.status = status;
                await designRequest.save();
                return res.status(200).json({ message: 'Design request status updated', designRequest });
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