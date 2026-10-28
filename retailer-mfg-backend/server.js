const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const app = express();

app.use(express.json());

const dbURI = 'mongodb+srv://watanashi_db_user:ID0oAxFLA49JWNPD@cluster0.qan7boh.mongodb.net/'
mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.log('Database connection error: ', err));

// The Architect's Vault Logic
const verifyRole = (requiredRole) => {
    return (req, res, next) => {
        const authHeader = req.header('Authorization');
        if (!authHeader) return res.status(401).json({ error: "Access Denied: No token provided" });

        // Standard format is "Bearer <token>"
        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: "Access Denied: Invalid token format" });

        try {
            // Cryptographically verify the token
            const verified = jwt.verify(token, 'mySuperSecretKey');
            req.user = verified; // This attaches { userId, role } to the request

            // Enforce the strict Role-Based Access Control
            if (req.user.role !== requiredRole) {
                return res.status(403).json({ error: "403 Forbidden: You do not have the correct role for this route" });
            }

            next(); // The user passed the security check, let them into the route
        } catch (error) {
            res.status(400).json({ error: "Invalid Token" });
        }
    };
};

app.get('/api/test', (req, res) => {
    res.json({message: "Sayan's server is officially running!"});
});

app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 1. Create a new user instance
        const newUser = new User({ email, password, role });

        // 2. Save to database (this automatically triggers your Bcrypt hook)
        await newUser.save();

        res.status(201).json({ 
            message: "User securely registered!", 
            userId: newUser._id 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        // 2. Verify the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // 3. Generate the JWT (The Key)
        // Note: In production, store 'mySuperSecretKey' in a .env file
        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            'mySuperSecretKey', 
            { expiresIn: '1h' }
        );

        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/manufacturer/queue', verifyRole('manufacturer'), (req, res) => {
    res.json({ message: "Access Granted: Welcome to the Manufacturer Production Queue!" });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});