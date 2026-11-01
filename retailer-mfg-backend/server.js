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

// --- FEATURE 4 (Retailer): Quality Control Hub Addresses ---
const retailerHubRoutes = require('./routes/retailerHubRoutes');
app.use('/api/retailer-hubs', retailerHubRoutes(verifyRole));

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

// --- FEATURE 5 (Retailer): Trend cache/database API for Retailer UI ---
const retailerTrendsRoutes = require('./routes/retailerTrendsRoutes');
app.use('/api/retailer-trends', retailerTrendsRoutes(verifyRole, cacheClient));

// --- FEATURE 6 (Retailer): Scored sentiment aggregation API for Retailer UI ---
const retailerSentimentRoutes = require('./routes/retailerSentimentRoutes');
app.use('/api/retailer-sentiment', retailerSentimentRoutes(verifyRole));

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

        // Increment the Retailer's metrics for the AI clustering engine
        const orderValue = (product.price || product.baseManufacturingCost) * quantity;
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { 
                'aiCluster.totalSpent': orderValue,
                'aiCluster.orderFrequency': 1
            }
        });

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
        connection = await amqp.connect('amqp://rabbitmq');
        channel = await connection.createChannel();
        await channel.assertQueue('ai_trend_dump', { durable: true });
        
        channel.consume('ai_trend_dump', async (msg) => {
            if (msg !== null) {
                const payload = JSON.parse(msg.content.toString());
                try {
                    await Trend.insertMany(payload); 
                    await cacheClient.del('trends_cache'); 
                    channel.ack(msg); 
                } catch (err) {
                    console.error('Failed to process AI dump:', err);
                }
            }
        });
        console.log('Connected to RabbitMQ & Consumer Active');
    } catch (error) {
        console.error('RabbitMQ Connection Error:', error);
    }
}
connectQueue();

app.post('/api/trends/dump', async (req, res) => {
    try {
        const data = req.body; 
        channel.sendToQueue('ai_trend_dump', Buffer.from(JSON.stringify(data)), { persistent: true });
        res.status(202).json({ message: "Data accepted into queue for asynchronous processing." });
    } catch (error) {
        res.status(500).json({ error: "Message Queue overload" });
    }
});

app.get('/api/trends', async (req, res) => {
    try {
        const cachedTrends = await cacheClient.get('trends_cache');
        if (cachedTrends) {
            return res.status(200).json({ source: 'Redis RAM', data: JSON.parse(cachedTrends) });
        }

        const dbTrends = await Trend.find().sort({ volume: -1 }).limit(100);
        await cacheClient.set('trends_cache', JSON.stringify(dbTrends), 'EX', 3600);
        
        res.status(200).json({ source: 'MongoDB', data: dbTrends });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- FEATURE 6: NLP Sentiment Update Webhook & Cache Invalidation ---
app.put('/api/trends/sentiment/:id', async (req, res) => {
    try {
        const { sentimentScore, confidence, extractedItem } = req.body;
        
        const updatedTrend = await Trend.findByIdAndUpdate(
            req.params.id, 
            { 
                extractedItem: extractedItem,
                sentiment: { 
                    score: sentimentScore, 
                    confidence: confidence 
                } 
            }, 
            { new: true }
        );

        if (!updatedTrend) {
            return res.status(404).json({ error: "Trend record not found." });
        }

        await cacheClient.del('trends_cache');
        res.status(200).json({ message: "Sentiment and Product Signal appended.", trend: updatedTrend });
    } catch (error) {
        res.status(500).json({ error: "Failed to process NLP payload." });
    }
});

// --- FEATURE 7: AI Customer Segmentation & Cursor Pagination ---
app.get('/api/customers', verifyRole('manufacturer'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor;
        
        let query = {};
        
        if (cursor) {
            query._id = { $gt: cursor };
        }

        const customers = await User.find(query)
            .sort({ _id: 1 })
            .limit(limit)
            .select('-password'); 

        const nextCursor = customers.length === limit ? customers[customers.length - 1]._id : null;

        res.status(200).json({
            data: customers,
            nextCursor: nextCursor
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to execute cursor pagination." });
    }
});

app.put('/api/customers/:id/cluster', async (req, res) => {
    try {
        const { clusterId, segmentName } = req.body;
        await User.findByIdAndUpdate(req.params.id, {
            'aiCluster.clusterId': clusterId,
            'aiCluster.segmentName': segmentName
        });
        res.status(200).send("Cluster updated");
    } catch (error) {
        res.status(500).send("Update failed");
    }
});

app.get('/api/internal/customers', async (req, res) => {
    try {
        const customers = await User.find().select('-password');
        res.status(200).json({ data: customers });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch internal data." });
    }
});

// --- DEMO SIMULATOR: Generate mock order history for the AI ---
app.post('/api/internal/simulate-data', async (req, res) => {
    try {
        const retailers = await User.find({ role: 'retailer' });
        for (let retailer of retailers) {
            const isVip = Math.random() > 0.6;
            const spend = isVip ? Math.floor(Math.random() * 50000) + 10000 : Math.floor(Math.random() * 5000) + 100;
            const freq = isVip ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 5) + 1;

            await User.findByIdAndUpdate(retailer._id, {
                'aiCluster.totalSpent': spend,
                'aiCluster.orderFrequency': freq
            });
        }
        res.status(200).json({ message: "Mock data generated successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to simulate data." });
    }
});

// --- FEATURE 8: Executive Decision Dashboard (Data Aggregator) ---
app.get('/api/dashboard/summary', verifyRole('manufacturer'), async (req, res) => {
    try {
        // 1. Sales Aggregation Pipeline ($match, $lookup, $group, $project)
        // Crunches raw transactional order records into grouped daily revenue summaries.
        const salesData = await Order.aggregate([
            { 
                $match: { status: { $ne: 'cancelled' } } 
            },
            {
                // Join the Product collection to access dynamic pricing for revenue math
                $lookup: {
                    from: 'products', 
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    dailyRevenue: { $sum: { $multiply: ["$quantity", "$productInfo.price"] } },
                    ordersCount: { $sum: 1 },
                    unitsMoved: { $sum: "$quantity" }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: "$_id",
                    dailyRevenue: 1,
                    ordersCount: 1,
                    unitsMoved: 1,
                    _id: 0
                }
            }
        ]);

        // 2. Customer Segment Distribution
        // Compiles the current K-Means clustering totals (VIPs, Regulars, Churn Risks)
        const customerClusters = await User.aggregate([
            { $match: { role: 'retailer' } },
            { 
                $group: { 
                    _id: "$aiCluster.segmentName", 
                    count: { $sum: 1 } 
                } 
            },
            {
                $project: {
                    segment: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // 3. Market Sentiment & Signals
        // Pulls the top 5 highest-volume trends scored by the Python BERT engine
        const topTrends = await Trend.find()
            .sort({ volume: -1 })
            .limit(5)
            .select('hashtag volume sentiment extractedItem -_id');

        // 4. Compile Optimized JSON Payload
        res.status(200).json({
            message: "Executive Data Aggregation Complete",
            dashboard: {
                salesTimeline: salesData,
                audienceSegments: customerClusters,
                marketSignals: topTrends
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to aggregate dashboard metrics: " + error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});