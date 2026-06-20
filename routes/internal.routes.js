const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');

// Middleware to verify internal API key
const verifyInternalApiKey = (req, res, next) => {
  const apiKey = req.headers['x-internal-api-key'];
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ success: false, message: 'Forbidden: Invalid internal API key' });
  }
  next();
};

// Internal route called by Super Admin to sync tickets
router.post('/support/sync', verifyInternalApiKey, supportController.syncTicketFromSuperadmin);

// Mock Master verify-subscription endpoint for local testing
router.get('/master/verify-subscription', (req, res) => {
  // In a real setup, this would be on a separate Master Superadmin server.
  // We return success: true to allow login to proceed locally.
  res.json({ success: true, message: 'Subscription active' });
});

module.exports = router;
