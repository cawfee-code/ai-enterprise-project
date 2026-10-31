const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');

// Schemas
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Hub = require('./models/Hub');
const cors = require('cors');

// Utilities
const redlock = require('./utils/redisLock');
const calculateDynamicPricing = require('./utils/costEngine');
const determineRoute = require('./utils/routingMachine');

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/designs'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Only JPG, PNG, SVG, or PDF allowed.'));
    }
});

app.use('/uploads', express.static('uploads'));

const dbURI = 'mongodb+srv://watanashi_db_user:ID0oAxFLA49JWNPD@cluster0.qan7boh.mongodb.net/'
mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.log('Database connection error: ', err));

const verifyRole = (requiredRole) => {
    return (req, res, next) => {
        const authHeader = req.header('Authorization');
        if (!authHeader) return res.status(401).json({ error: "Access Denied: No token provided" });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Access Denied: Invalid token format" });

        try {
            const verified = jwt.verify(token, 'mySuperSecretKey');
            req.user = verified; 
            if (req.user.role !== requiredRole) {
                return res.status(403).json({ error: "403 Forbidden: You do not have the correct role for this route" });
            }
            next(); 
        } catch (error) {
            res.status(400).json({ error: "Invalid Token" });
        }
    };
};

// --- FEATURE 1: Authentication ---
const userAuthRoutes = require('./routes/userAuthRoutes');
app.use('/api/users', userAuthRoutes);

app.post('/api/manufacturer/queue', verifyRole('manufacturer'), (req, res) => {
    res.json({ message: "Access Granted: Welcome to the Manufacturer Production Queue!" });
});

// --- FEATURE 2: Retailer Design Management ---
const designRoutes = require('./routes/designRoutes');
app.use('/api/designs', designRoutes(verifyRole, upload));

// --- FEATURE 3: Dynamic Pricing Catalog ---
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

app.post('/api/products', verifyRole('manufacturer'), async (req, res) => {
    try {
        const { name, description, baseManufacturingCost, targetMarginPercentage, physicalWeightKg, dimensions, stockCount } = req.body;
        
        const pricingData = calculateDynamicPricing({
            baseManufacturingCost, targetMarginPercentage, physicalWeightKg, dimensions
        });

        const newProduct = new Product({
            manufacturerId: req.user.userId, name, description, baseManufacturingCost, 
            targetMarginPercentage, physicalWeightKg, dimensions, price: pricingData.finalPrice, stockCount
        });
        
        await newProduct.save();
        res.status(201).json({ message: "Product added to catalog!", engineMetrics: pricingData, product: newProduct });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// --- FEATURE 2 & 4: Distributed Lock Orders & Supply Chain Routing ---
app.post('/api/orders', verifyRole('retailer'), async (req, res) => {
    const { productId, quantity, customerAddress } = req.body;
    const resource = `locks:product:${productId}`;
    const ttl = 5000; 
    let lock;
    
    try {
        lock = await redlock.acquire([resource], ttl);
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.stockCount < quantity) return res.status(400).json({ error: 'Insufficient stock' });

        // Feature 4: Calculate logistics route based on quantity
        const mockMfgHub = { type: "Point", coordinates: [-122.4194, 37.7749], address: "SF Factory" };
        const mockQCHub = { type: "Point", coordinates: [-74.0060, 40.7128], address: "NY Retailer QC" };
        const routingPlan = determineRoute(quantity, mockMfgHub, mockQCHub, customerAddress);

        const newOrder = new Order({ retailerId: req.user.userId, productId, quantity });
        await newOrder.save();

        product.stockCount -= quantity;
        await product.save();

        res.status(201).json({ 
            message: "Order processed safely!", 
            order: newOrder, 
            logistics: routingPlan,
            remainingStock: product.stockCount 
        });
    } catch (error) {
        if (error.name === 'ExecutionError') return res.status(429).json({ error: 'High traffic. Try again.' });
        res.status(500).json({ error: error.message });
    } finally {
        if (lock) await lock.release().catch(err => console.error(err));
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});