const express = require('express');
const Hub = require('../models/Hub');
const geocodePincode = require('../utils/geocodePincode');

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

    // CREATE — a pin code is geocoded into the same GeoJSON Point the distance calc already uses
    router.post('/', verifyRole('retailer'), async (req, res) => {
        try {
            const { pincode, addressLine } = req.body;
            if (!pincode || typeof pincode !== 'string' || !pincode.trim()) {
                return res.status(400).json({ error: 'Pin code is required.' });
            }

            const { latitude, longitude } = await geocodePincode(pincode.trim());
            const trimmedAddressLine = (addressLine || '').trim();

            const hub = new Hub({
                ownerId: req.user.userId,
                hubType: 'retailer_qc_hub',
                pincode: pincode.trim(),
                addressLine: trimmedAddressLine,
                addressString: trimmedAddressLine || pincode.trim(),
                location: { type: 'Point', coordinates: [longitude, latitude] }
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

            const { pincode, addressLine } = req.body;
            if (pincode !== undefined) {
                if (!pincode.trim()) {
                    return res.status(400).json({ error: 'Pin code is required.' });
                }
                const { latitude, longitude } = await geocodePincode(pincode.trim());
                hub.pincode = pincode.trim();
                hub.location = { type: 'Point', coordinates: [longitude, latitude] };
            }
            if (addressLine !== undefined) {
                hub.addressLine = addressLine.trim();
            }
            hub.addressString = hub.addressLine || hub.pincode;

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