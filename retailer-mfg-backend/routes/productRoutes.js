const express = require('express');
const Product = require('../models/Product');
const calculateDynamicPricing = require('../utils/costEngine');

// multer parses multipart/form-data fields flat, so "dimensions[lengthCm]" arrives as a
// literal key rather than a nested object the way a JSON body would. This reads dimensions
// from either shape so the route works for both JSON requests and the multipart rate-setting form.
function extractDimensions(body) {
    if (body.dimensions && typeof body.dimensions === 'object') {
        return body.dimensions;
    }
    const lengthCm = body['dimensions[lengthCm]'];
    const widthCm = body['dimensions[widthCm]'];
    const heightCm = body['dimensions[heightCm]'];
    if (lengthCm !== undefined || widthCm !== undefined || heightCm !== undefined) {
        return { lengthCm: Number(lengthCm), widthCm: Number(widthCm), heightCm: Number(heightCm) };
    }
    return undefined;
}

module.exports = (verifyRole, upload) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        const products = await Product.find().populate('manufacturerId', 'businessName email');

        // Reuse the Feature 3 pricing engine to surface its cost breakdown to retailers
        // (operational cost, billable weight, etc.) alongside the catalog listing —
        // nothing new stored, just recomputed from the same fields already on each product.
        const withPricing = products.map((product) => {
            const engineMetrics = calculateDynamicPricing({
                baseManufacturingCost: product.baseManufacturingCost,
                targetMarginPercentage: product.targetMarginPercentage,
                physicalWeightKg: product.physicalWeightKg,
                dimensions: product.dimensions
            });
            return { ...product.toObject(), engineMetrics };
        });

        res.json(withPricing);
    });

    router.post('/', verifyRole('manufacturer'), upload.single('designFile'), async (req, res) => {
        try {
            const { name, description, stockCount } = req.body;
            const baseManufacturingCost = Number(req.body.baseManufacturingCost);
            const targetMarginPercentage = Number(req.body.targetMarginPercentage);
            const physicalWeightKg = Number(req.body.physicalWeightKg);
            const dimensions = extractDimensions(req.body);

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

            const { name, description, stockCount } = req.body;
            const baseManufacturingCost = req.body.baseManufacturingCost !== undefined ? Number(req.body.baseManufacturingCost) : undefined;
            const targetMarginPercentage = req.body.targetMarginPercentage !== undefined ? Number(req.body.targetMarginPercentage) : undefined;
            const physicalWeightKg = req.body.physicalWeightKg !== undefined ? Number(req.body.physicalWeightKg) : undefined;
            const dimensions = extractDimensions(req.body);

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