const express = require('express');
const passport = require('passport');
const { generateToken } = require('../middleware/auth');
const { User } = require('../models');

const router = express.Router();

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth authentication
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Authentication failed
 */
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  async (req, res) => {
    try {
      // Update last login
      await User.update(
        { last_login: new Date() },
        { where: { id: req.user.id } }
      );

      const token = generateToken(req.user);
      
      // In a real application, you might redirect to your frontend with the token
      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          avatar: req.user.avatar
        }
      });
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/failure:
 *   get:
 *     summary: Authentication failure endpoint
 *     tags: [Authentication]
 *     responses:
 *       401:
 *         description: Authentication failed
 */
router.get('/failure', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Authentication failed'
  });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

module.exports = router;