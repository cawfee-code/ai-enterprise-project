const express = require('express');
const Hub = require('../models/Hub');
const geocodePincode = require('../utils/geocodePincode');

module.exports = (verifyRole) => {
    const router = express.Router();

    router.get('/', verifyRole('manufacturer'), async (req, res) => {
        try {
            const hubs = await Hub.find({ ownerId: req.user.userId, hubType: 'manufacturer_warehouse' }).sort({ createdAt: -1 });
            res.json(hubs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', verifyRole('manufacturer'), async (req, res) => {
        try {
            const { pincode } = req.body;
            if (!pincode || typeof pincode !== 'string' || !pincode.trim()) {
                return res.status(400).json({ error: 'Pin code is required.' });
            }

            const { latitude, longitude } = await geocodePincode(pincode.trim());

            const hub = new Hub({
                ownerId: req.user.userId,
                hubType: 'manufacturer_warehouse',
                addressString: pincode.trim(),
                location: { type: 'Point', coordinates: [longitude, latitude] }
            });
            await hub.save();
            res.status(201).json({ message: 'Warehouse hub added', hub });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.put('/:id', verifyRole('manufacturer'), async (req, res) => {
        try {
            const hub = await Hub.findOne({ _id: req.params.id, hubType: 'manufacturer_warehouse' });
            if (!hub) return res.status(404).json({ error: 'Warehouse hub not found' });
            if (hub.ownerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'You do not have access to this warehouse hub' });
            }

            const { pincode } = req.body;
            if (pincode !== undefined) {
                if (!pincode.trim()) {
                    return res.status(400).json({ error: 'Pin code is required.' });
                }
                const { latitude, longitude } = await geocodePincode(pincode.trim());
                hub.addressString = pincode.trim();
                hub.location = { type: 'Point', coordinates: [longitude, latitude] };
            }

            await hub.save();
            res.json({ message: 'Warehouse hub updated', hub });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.delete('/:id', verifyRole('manufacturer'), async (req, res) => {
        try {
            const hub = await Hub.findOne({ _id: req.params.id, hubType: 'manufacturer_warehouse' });
            if (!hub) return res.status(404).json({ error: 'Warehouse hub not found' });
            if (hub.ownerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'You do not have access to this warehouse hub' });
            }
            await hub.deleteOne();
            res.json({ message: 'Warehouse hub deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};