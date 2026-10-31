const express = require('express');
const Design = require('../models/Design');

module.exports = (verifyRole, upload) => {
    const router = express.Router();

    // Retailer's own designs only
    router.get('/', verifyRole('retailer'), async (req, res) => {
        try {
            const designs = await Design.find({ retailerId: req.user.userId });
            res.json(designs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', verifyRole('retailer'), upload.single('designFile'), async (req, res) => {
        try {
            const { name, description } = req.body;

            const newDesign = new Design({
                retailerId: req.user.userId,
                name,
                description,
                designFileUrl: req.file ? `/uploads/designs/${req.file.filename}` : null
            });

            await newDesign.save();
            res.status(201).json({ message: "Design uploaded!", design: newDesign });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.put('/:id', verifyRole('retailer'), upload.single('designFile'), async (req, res) => {
        try {
            const design = await Design.findById(req.params.id);
            if (!design) return res.status(404).json({ error: "Design not found" });
            if (design.retailerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: "You can only edit your own designs" });
            }

            const { name, description } = req.body;
            if (name) design.name = name;
            if (description !== undefined) design.description = description;
            if (req.file) design.designFileUrl = `/uploads/designs/${req.file.filename}`;

            await design.save();
            res.json({ message: "Design updated!", design });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.delete('/:id', verifyRole('retailer'), async (req, res) => {
        try {
            const design = await Design.findById(req.params.id);
            if (!design) return res.status(404).json({ error: "Design not found" });
            if (design.retailerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: "You can only delete your own designs" });
            }

            await Design.findByIdAndDelete(req.params.id);
            res.json({ message: "Design deleted" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};