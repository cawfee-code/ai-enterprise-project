const express = require('express');
const Hub = require('../models/Hub');

module.exports = (verifyRole) => {
    const router = express.Router();

    // READ — list this retailer's QC hubs
    router.get('/', verifyRole('retailer'), async (req, res) => {
        try {
            const hubs = await Hub.find({ ownerId: req.user.userId, hubType: 'retailer_qc_hub' }).sort({ createdAt: -1 });
            res.json(hubs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // CREATE
    router.post('/', verifyRole('retailer'), async (req, res) => {
        try {
            const { addressString, latitude, longitude } = req.body;

            if (!addressString || typeof addressString !== 'string') {
                return res.status(400).json({ error: 'Address is required.' });
            }
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            if (Number.isNaN(lat) || lat < -90 || lat > 90) {
                return res.status(400).json({ error: 'Latitude must be a number between -90 and 90.' });
            }
            if (Number.isNaN(lng) || lng < -180 || lng > 180) {
                return res.status(400).json({ error: 'Longitude must be a number between -180 and 180.' });
            }

            const hub = new Hub({
                ownerId: req.user.userId,
                hubType: 'retailer_qc_hub',
                addressString,
                location: { type: 'Point', coordinates: [lng, lat] }
            });
            await hub.save();
            res.status(201).json({ message: 'QC hub added', hub });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // UPDATE
    router.put('/:id', verifyRole('retailer'), async (req, res) => {
        try {
            const hub = await Hub.findOne({ _id: req.params.id, hubType: 'retailer_qc_hub' });
            if (!hub) return res.status(404).json({ error: 'QC hub not found' });
            if (hub.ownerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'You do not have access to this QC hub' });
            }

            const { addressString, latitude, longitude } = req.body;
            if (addressString !== undefined) hub.addressString = addressString;
            if (latitude !== undefined || longitude !== undefined) {
                const lat = latitude !== undefined ? parseFloat(latitude) : hub.location.coordinates[1];
                const lng = longitude !== undefined ? parseFloat(longitude) : hub.location.coordinates[0];
                if (Number.isNaN(lat) || lat < -90 || lat > 90) {
                    return res.status(400).json({ error: 'Latitude must be a number between -90 and 90.' });
                }
                if (Number.isNaN(lng) || lng < -180 || lng > 180) {
                    return res.status(400).json({ error: 'Longitude must be a number between -180 and 180.' });
                }
                hub.location = { type: 'Point', coordinates: [lng, lat] };
            }

            await hub.save();
            res.json({ message: 'QC hub updated', hub });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // DELETE
    router.delete('/:id', verifyRole('retailer'), async (req, res) => {
        try {
            const hub = await Hub.findOne({ _id: req.params.id, hubType: 'retailer_qc_hub' });
            if (!hub) return res.status(404).json({ error: 'QC hub not found' });
            if (hub.ownerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'You do not have access to this QC hub' });
            }
            await hub.deleteOne();
            res.json({ message: 'QC hub deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};