const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const auth = require('../middleware/auth');

// Create a public ticket (from login page / public UI)
router.post('/public-ticket', supportController.createPublicTicket);

// Protected routes for logged-in users
router.use(auth);

// Ticket fetching
router.get('/my-tickets', supportController.getMyTickets);
router.get('/company-tickets', supportController.getCompanyTickets);
router.get('/ticket/:id', supportController.getTicketDetails);

// Ticket actions
router.post('/ticket', supportController.createTicket);
router.post('/reply/:id', supportController.replyToTicket);
router.put('/status/:id', supportController.updateTicketStatus);

module.exports = router;
