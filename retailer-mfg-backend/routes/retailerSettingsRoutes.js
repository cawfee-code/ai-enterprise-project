const express = require('express');
const RetailerSettings = require('../models/RetailerSettings');

module.exports = (verifyRole) => {
    const router = express.Router();

    // READ — get the retailer's own settings
    router.get('/me', verifyRole('retailer'), async (req, res) => {
        try {
            const settings = await RetailerSettings.findOne({ retailerId: req.user.userId });
            if (!settings) {
                return res.json({ exists: false, targetProfitPercentage: null });
            }
            res.json({ exists: true, targetProfitPercentage: settings.targetProfitPercentage, updatedAt: settings.updatedAt });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // CREATE/UPDATE — upsert the retailer's own settings
    router.put('/me', verifyRole('retailer'), async (req, res) => {
        try {
            const { targetProfitPercentage } = req.body;

            if (typeof targetProfitPercentage !== 'number' || targetProfitPercentage < 0 || targetProfitPercentage > 100) {
                return res.status(400).json({ error: 'Target profit percentage must be a number between 0 and 100.' });
            }

            const settings = await RetailerSettings.findOneAndUpdate(
                { retailerId: req.user.userId },
                { targetProfitPercentage },
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
            );

            res.json({ message: 'Settings saved', targetProfitPercentage: settings.targetProfitPercentage });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // DELETE — clear the retailer's settings
    router.delete('/me', verifyRole('retailer'), async (req, res) => {
        try {
            const settings = await RetailerSettings.findOneAndDelete({ retailerId: req.user.userId });
            if (!settings) return res.status(404).json({ error: 'No settings found' });
            res.json({ message: 'Settings cleared' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};