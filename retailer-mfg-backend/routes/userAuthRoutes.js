const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isStrongPassword } = require('../utils/validators');

const router = express.Router();

router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (role && user.role !== role) {
            return res.status(403).json({ error: `This account is not registered as a ${role}.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id, role: user.role }, 'mySuperSecretKey', { expiresIn: '1h' });
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword, role } = req.body;

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (role && user.role !== role) {
            return res.status(403).json({ error: `This account is not registered as a ${role}.` });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;