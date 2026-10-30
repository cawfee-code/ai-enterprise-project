const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const redlock = require('./utils/redisLock');
const calculateDynamicPricing = require('./utils/costEngine');
const { isStrongPassword } = require('./utils/validators');
const issueToken = require('./middleware/issueToken');

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/designs'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

app.use('/uploads', express.static('uploads'));

const dbURI = 'mongodb+srv://watanashi_db_user:ID0oAxFLA49JWNPD@cluster0.qan7boh.mongodb.net/'
mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.log('Database connection error: ', err));

// The Architect's Vault Logic
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
                return res.status(403).json({ error: "403 Forbidden: You do not have the correct role" });
            }
            next(); 
        } catch (error) {
            res.status(400).json({ error: "Invalid Token" });
        }
    };
};

// --- FEATURE 1: Authentication (generic, used by manufacturer forms) ---
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!isStrongPassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.' });
        }

        const newUser = new User({ email, password, role });
        await newUser.save();
        res.status(201).json({ message: "User securely registered!", userId: newUser._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id, role: user.role }, 'mySuperSecretKey', { expiresIn: '1h' });
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- FEATURE 1: Retailer-Specific Authentication ---
app.post('/api/retailers/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!isStrongPassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.' });
        }

        const newUser = new User({ email, password, role: 'retailer' });
        await newUser.save();
        res.status(201).json({ message: "Retailer registered!", userId: newUser._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/retailers/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.role !== 'retailer') {
            return res.status(403).json({ error: "This account is not registered as a retailer." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = issueToken(user);
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/retailers/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.role !== 'retailer') {
            return res.status(403).json({ error: "This account is not registered as a retailer." });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- FEATURE 1: Manufacturer-Specific Authentication ---
app.post('/api/manufacturers/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!isStrongPassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.' });
        }

        const newUser = new User({ email, password, role: 'manufacturer' });
        await newUser.save();
        res.status(201).json({ message: "Manufacturer registered!", userId: newUser._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/manufacturers/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.role !== 'manufacturer') {
            return res.status(403).json({ error: "This account is not registered as a manufacturer." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id, role: user.role }, 'mySuperSecretKey', { expiresIn: '1h' });
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- FEATURE 3: Dynamic Pricing Catalog ---
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

app.post('/api/products', verifyRole('manufacturer'), upload.single('designFile'), async (req, res) => {
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

app.put('/api/products/:id', verifyRole('manufacturer'), upload.single('designFile'), async (req, res) => {
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

app.delete('/api/products/:id', verifyRole('manufacturer'), async (req, res) => {
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

// --- FEATURE 2: Redis Distributed Lock Orders ---
app.post('/api/orders', verifyRole('retailer'), async (req, res) => {
    const { productId, quantity } = req.body;
    const resource = `locks:product:${productId}`;
    const ttl = 5000; 
    let lock;
    try {
        lock = await redlock.acquire([resource], ttl);
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.stockCount < quantity) return res.status(400).json({ error: 'Insufficient stock' });

        const newOrder = new Order({ retailerId: req.user.userId, productId, quantity });
        await newOrder.save();

        product.stockCount -= quantity;
        await product.save();

        res.status(201).json({ message: "Order placed successfully!", order: newOrder, remainingStock: product.stockCount });
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