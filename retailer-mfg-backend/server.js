const amqp = require('amqplib');
const Trend = require('./models/Trend');
const Redis = require('ioredis');
const cacheClient = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1', port: 6379 });
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

const crypto = require('crypto');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/designs'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
const retailerSettingsRoutes = require('./routes/retailerSettingsRoutes');
app.use('/api/retailer-settings', retailerSettingsRoutes(verifyRole));

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

// --- FEATURE 5: RabbitMQ & Redis Caching ---

let channel, connection;
async function connectQueue() {
    try {
        // Connects to the Docker container named 'rabbitmq'
        connection = await amqp.connect('amqp://rabbitmq');
        channel = await connection.createChannel();
        await channel.assertQueue('ai_trend_dump', { durable: true });
        
        // Consumer: Listens to the queue and writes to MongoDB asynchronously
        channel.consume('ai_trend_dump', async (msg) => {
            if (msg !== null) {
                const payload = JSON.parse(msg.content.toString());
                try {
                    await Trend.insertMany(payload); // Bulk insert Abhik's scraped data
                    await cacheClient.del('trends_cache'); // Invalidate old Redis cache
                    channel.ack(msg); // Acknowledge successful processing
                } catch (err) {
                    console.error('Failed to process AI dump:', err);
                    // Do not ack, so RabbitMQ requeues it
                }
            }
        });
        console.log('Connected to RabbitMQ & Consumer Active');
    } catch (error) {
        console.error('RabbitMQ Connection Error:', error);
    }
}
connectQueue();

// Boundary Logic: The POST route Abhik hits. It DOES NOT touch the database directly.
app.post('/api/trends/dump', async (req, res) => {
    try {
        const data = req.body; // Array of scraped JSON objects
        // Push payload to RabbitMQ to prevent Node.js thread blocking
        channel.sendToQueue('ai_trend_dump', Buffer.from(JSON.stringify(data)), { persistent: true });
        res.status(202).json({ message: "Data accepted into queue for asynchronous processing." });
    } catch (error) {
        res.status(500).json({ error: "Message Queue overload" });
    }
});

// Fast Retrieval: Fetches trends in < 2ms using Redis RAM
app.get('/api/trends', async (req, res) => {
    try {
        // 1. Check Redis Cache First
        const cachedTrends = await cacheClient.get('trends_cache');
        if (cachedTrends) {
            return res.status(200).json({ source: 'Redis RAM', data: JSON.parse(cachedTrends) });
        }

        // 2. Cache Miss: Query MongoDB
        const dbTrends = await Trend.find().sort({ volume: -1 }).limit(100);
        
        // 3. Store in Redis for future requests (Expires in 1 hour)
        await cacheClient.set('trends_cache', JSON.stringify(dbTrends), 'EX', 3600);
        
        res.status(200).json({ source: 'MongoDB', data: dbTrends });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});