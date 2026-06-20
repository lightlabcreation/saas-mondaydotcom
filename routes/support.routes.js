const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');

// Create a public ticket (from login page / public UI)
router.post('/public-ticket', supportController.createPublicTicket);

module.exports = router;
