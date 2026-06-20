const { sequelize, SupportMessage } = require('../models');

// Handle creating a support ticket from public/login page
exports.createPublicTicket = async (req, res) => {
  try {
    const { name, phone, email, subject, category, description } = req.body;

    // Generate unique ticket number
    const ticketNumber = `TKT-PUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullDescription = `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\n\nDetails: ${description}`;

    // 1. Insert into local support_tickets table
    const sql = `
      INSERT INTO support_tickets (ticket_number, company_id, company_name, project_name, user_id, subject, category, priority, description, status, created_at, updated_at)
      VALUES (?, 0, 'Public Inquiry', 'monday.com SaaS', 0, ?, ?, 'Medium', ?, 'Open', NOW(), NOW())
    `;
    
    await sequelize.query(sql, {
      replacements: [ticketNumber, subject, category, fullDescription]
    });

    // 2. Sync to Super Admin (fire and forget or await, depending on strictness)
    try {
      const payload = {
        ticketNumber,
        companyId: 0,
        companyName: "Public Inquiry",
        userId: 0,
        subject,
        category,
        priority: "Medium",
        description: fullDescription,
        projectName: "monday.com SaaS"
      };

      const syncRes = await fetch(`${process.env.SUPERADMIN_API_URL}/support/create-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.INTERNAL_API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!syncRes.ok) {
        console.error('Failed to sync ticket to Super Admin', await syncRes.text());
      }
    } catch (syncErr) {
      console.error('Error syncing ticket to Super Admin:', syncErr);
    }

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticketNumber
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating ticket' });
  }
};

// Handle sync requests from Super Admin
exports.syncTicketFromSuperadmin = async (req, res) => {
  try {
    const { action, ticketNumber, reply, status } = req.body;

    // Find the ticket locally
    const [tickets] = await sequelize.query('SELECT * FROM support_tickets WHERE ticket_number = ?', {
      replacements: [ticketNumber]
    });
    
    // In Sequelize query, the result is usually an array where index 0 contains the rows
    const ticket = tickets[0];

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (action === 'reply' && reply) {
      // Insert admin reply
      await sequelize.query(
        'INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, message) VALUES (?, "admin", 0, ?)',
        { replacements: [ticket.id, reply] }
      );
      // Set status to Waiting for Client
      await sequelize.query(
        'UPDATE support_tickets SET status = "Waiting For Client", updated_at = NOW() WHERE id = ?',
        { replacements: [ticket.id] }
      );
    } else if (action === 'status' && status) {
      // Update local ticket status
      await sequelize.query(
        'UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?',
        { replacements: [status, ticket.id] }
      );
    }

    res.json({ success: true, message: 'Sync successful' });
  } catch (error) {
    console.error('Sync ticket error:', error);
    res.status(500).json({ success: false, message: 'Server error while syncing ticket' });
  }
};

// Get tickets for logged-in user
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const [tickets] = await sequelize.query(
      'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC',
      { replacements: [userId] }
    );
    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tickets' });
  }
};

// Get all tickets for a company
exports.getCompanyTickets = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const [tickets] = await sequelize.query(
      'SELECT * FROM support_tickets WHERE company_id = ? ORDER BY created_at DESC',
      { replacements: [companyId] }
    );
    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Get company tickets error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching company tickets' });
  }
};

// Get ticket details and messages
exports.getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [messages] = await sequelize.query(
      'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC',
      { replacements: [id] }
    );
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching ticket details' });
  }
};

// Create a ticket for logged-in user
exports.createTicket = async (req, res) => {
  try {
    const { subject, category, priority, description } = req.body;
    const userId = req.user.id;
    const companyId = req.user.companyId || 0;
    const companyName = req.user.companyName || 'Unknown Company';
    
    // Generate unique ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const sql = `
      INSERT INTO support_tickets (ticket_number, company_id, company_name, project_name, user_id, subject, category, priority, description, status, created_at, updated_at)
      VALUES (?, ?, ?, 'monday.com SaaS', ?, ?, ?, ?, ?, 'Open', NOW(), NOW())
    `;
    
    const [result] = await sequelize.query(sql, {
      replacements: [ticketNumber, companyId, companyName, userId, subject, category, priority || 'Medium', description]
    });
    
    const newTicketId = result;

    // Sync to Super Admin
    try {
      const payload = {
        ticketNumber,
        companyId,
        companyName,
        userId,
        subject,
        category,
        priority: priority || 'Medium',
        description,
        projectName: "monday.com SaaS"
      };

      fetch(`${process.env.SUPERADMIN_API_URL}/support/create-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.INTERNAL_API_KEY
        },
        body: JSON.stringify(payload)
      }).catch(err => console.error('Error syncing ticket to Super Admin (async):', err));
    } catch (syncErr) {
      console.error('Error initiating sync ticket to Super Admin:', syncErr);
    }

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: { id: newTicketId, ticketNumber }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating ticket' });
  }
};

// Reply to a ticket
exports.replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    // Insert user reply
    await sequelize.query(
      'INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, message, created_at) VALUES (?, "client", ?, ?, NOW())',
      { replacements: [id, userId, message] }
    );
    
    // Set status to Open (since client replied)
    await sequelize.query(
      'UPDATE support_tickets SET status = "Open", updated_at = NOW() WHERE id = ?',
      { replacements: [id] }
    );

    // Fetch ticket number to sync
    const [tickets] = await sequelize.query('SELECT ticket_number FROM support_tickets WHERE id = ?', {
      replacements: [id]
    });

    if (tickets && tickets.length > 0) {
      const ticketNumber = tickets[0].ticket_number;
      // Sync to Superadmin
      fetch(`${process.env.SUPERADMIN_API_URL}/support/sync-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.INTERNAL_API_KEY
        },
        body: JSON.stringify({
          action: 'reply',
          ticketNumber,
          reply: message,
          senderType: 'client'
        })
      }).catch(err => console.error('Error syncing reply to Super Admin:', err));
    }

    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Reply to ticket error:', error);
    res.status(500).json({ success: false, message: 'Server error sending reply' });
  }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await sequelize.query(
      'UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?',
      { replacements: [status, id] }
    );

    // Fetch ticket number to sync
    const [tickets] = await sequelize.query('SELECT ticket_number FROM support_tickets WHERE id = ?', {
      replacements: [id]
    });

    if (tickets && tickets.length > 0) {
      const ticketNumber = tickets[0].ticket_number;
      // Sync to Superadmin
      fetch(`${process.env.SUPERADMIN_API_URL}/support/sync-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.INTERNAL_API_KEY
        },
        body: JSON.stringify({
          action: 'status',
          ticketNumber,
          status
        })
      }).catch(err => console.error('Error syncing status to Super Admin:', err));
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};
