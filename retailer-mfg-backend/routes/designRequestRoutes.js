const express = require('express');
const DesignRequest = require('../models/DesignRequest');
const Design = require('../models/Design');
const User = require('../models/User');

module.exports = (verifyRole) => {
    const router = express.Router();

    // Retailer sends a custom design request to a manufacturer, identified by business name
    router.post('/', verifyRole('retailer'), async (req, res) => {
        try {
            const { designId, manufacturerBusinessName, quantity, note } = req.body;

            if (!designId) return res.status(400).json({ error: 'A design is required.' });
            if (!manufacturerBusinessName || !manufacturerBusinessName.trim()) {
                return res.status(400).json({ error: "The manufacturer's business name is required." });
            }

            const design = await Design.findOne({ _id: designId, retailerId: req.user.userId });
            if (!design) return res.status(404).json({ error: 'Design not found.' });

            const escaped = manufacturerBusinessName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const matches = await User.find({
                role: 'manufacturer',
                businessName: new RegExp(`^${escaped}$`, 'i')
            });

            if (matches.length === 0) {
                return res.status(404).json({ error: 'No manufacturer found with that business name.' });
            }
            if (matches.length > 1) {
                return res.status(400).json({ error: 'More than one manufacturer uses that business name. Ask them to confirm which one, or double-check the spelling.' });
            }

            const designRequest = new DesignRequest({
                retailerId: req.user.userId,
                manufacturerId: matches[0]._id,
                designId,
                quantity: quantity && quantity > 0 ? quantity : 1,
                note: note || ''
            });
            await designRequest.save();
            res.status(201).json({ message: 'Custom design request sent', designRequest });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Retailer views the design requests they've sent out
    router.get('/', verifyRole('retailer'), async (req, res) => {
        try {
            const requests = await DesignRequest.find({ retailerId: req.user.userId })
                .sort({ createdAt: -1 })
                .populate('designId', 'name designFileUrl')
                .populate('manufacturerId', 'businessName email');
            res.status(200).json({ data: requests });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};