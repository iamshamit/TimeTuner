const jwt = require('jsonwebtoken');

class JWTService {
    // Generate Access Token (short-lived: 15 minutes)
    static generateAccessToken(user) {
        return jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                department: user.department
            },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );
    }

    // Generate Refresh Token (long-lived: 7 days)
    static generateRefreshToken(user) {
        return jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
    }

    // Verify Access Token
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }

    // Verify Refresh Token
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    // Generate both tokens
    static generateTokens(user) {
        return {
            accessToken: this.generateAccessToken(user),
            refreshToken: this.generateRefreshToken(user)
        };
    }
}

module.exports = JWTService;
