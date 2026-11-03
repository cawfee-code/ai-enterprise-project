const express = require('express');
const Order = require('../models/Order');

module.exports = (verifyRole) => {
    const router = express.Router();

    // Feature: Retailer-facing order history, so a retailer can track the
    // status of what they've requested from manufacturers.
    router.get('/', verifyRole('retailer'), async (req, res) => {
        try {
            const orders = await Order.find({ retailerId: req.user.userId })
                .sort({ createdAt: -1 })
                .populate({
                    path: 'productId',
                    select: 'name',
                    populate: { path: 'manufacturerId', select: 'businessName email' }
                });

            res.status(200).json({ data: orders });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch your orders: ' + error.message });
        }
    });

    return router;
};