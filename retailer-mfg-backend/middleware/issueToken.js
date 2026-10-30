const jwt = require('jsonwebtoken');

// The Architect's JWT issuance middleware.
// Retailer/Manufacturer routes hand off validated user payloads here;
// this is the single place that mints tokens.
function issueToken(user) {
    return jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'mySuperSecretKey',
        { expiresIn: '1h' }
    );
}

module.exports = issueToken;