const express = require('express');
const Product = require('../models/Product');
const calculateDynamicPricing = require('../utils/costEngine');

module.exports = (verifyRole, upload) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        const products = await Product.find();
        res.json(products);
    });

    router.post('/', verifyRole('manufacturer'), upload.single('designFile'), async (req, res) => {
        try {
            const { name, description, baseManufacturingCost, targetMarginPercentage, physicalWeightKg, dimensions, stockCount } = req.body;

            const pricingData = calculateDynamicPricing({
                baseManufacturingCost, targetMarginPercentage, physicalWeightKg, dimensions
            });

            const newProduct = new Product({
                manufacturerId: req.user.userId,
                name, description, baseManufacturingCost, targetMarginPercentage, physicalWeightKg, dimensions,
                price: pricingData.finalPrice, stockCount,
                designFileUrl: req.file ? `/uploads/designs/${req.file.filename}` : null
            });

            await newProduct.save();
            res.status(201).json({ message: "Product added to catalog!", engineMetrics: pricingData, product: newProduct });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.put('/:id', verifyRole('manufacturer'), upload.single('designFile'), async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ error: "Product not found" });
            if (product.manufacturerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: "You can only edit your own products" });
            }

            const { name, description, baseManufacturingCost, targetMarginPercentage, physicalWeightKg, dimensions, stockCount } = req.body;

            if (baseManufacturingCost || targetMarginPercentage || physicalWeightKg || dimensions) {
                const pricingData = calculateDynamicPricing({
                    baseManufacturingCost: baseManufacturingCost ?? product.baseManufacturingCost,
                    targetMarginPercentage: targetMarginPercentage ?? product.targetMarginPercentage,
                    physicalWeightKg: physicalWeightKg ?? product.physicalWeightKg,
                    dimensions: dimensions ?? product.dimensions
                });
                product.price = pricingData.finalPrice;
            }

            if (name) product.name = name;
            if (description) product.description = description;
            if (baseManufacturingCost) product.baseManufacturingCost = baseManufacturingCost;
            if (targetMarginPercentage) product.targetMarginPercentage = targetMarginPercentage;
            if (physicalWeightKg) product.physicalWeightKg = physicalWeightKg;
            if (dimensions) product.dimensions = dimensions;
            if (stockCount !== undefined) product.stockCount = stockCount;
            if (req.file) product.designFileUrl = `/uploads/designs/${req.file.filename}`;

            await product.save();
            res.json({ message: "Product updated!", product });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.delete('/:id', verifyRole('manufacturer'), async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ error: "Product not found" });
            if (product.manufacturerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: "You can only delete your own products" });
            }

            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: "Product deleted" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};