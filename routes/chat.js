const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { SupportMessage, User } = require('../models');
const { Op } = require('sequelize');

// @route   GET /api/chat/history
// @desc    Get chat history for a specific user (admin fetching user's history, or user fetching their own)
// @access  Private
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Allow any user to fetch their P2P history with another user
    const messages = await SupportMessage.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id }
        ]
      },
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'name', 'email', 'avatar'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (err) {
    console.error('[API] Error fetching chat history', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/chat/users
// @desc    Get all users who have sent support messages (for Superadmin Inbox)
// @access  Private (Superadmin only)
router.get('/users', auth, async (req, res) => {
  try {
    const isAdmin = ['Superadmin', 'superadmin', 'Admin'].includes(req.user.role);
    
    let whereClause = {};
    if (!isAdmin && req.user.companyId) {
      // Normal users see users in their own company OR system admins
      whereClause = {
        [Op.or]: [
          { companyId: req.user.companyId },
          { role: ['Superadmin', 'superadmin', 'Admin', 'System Admin', 'Super Admin'] }
        ]
      };
    }

    const finalWhere = {
      [Op.and]: [
        whereClause,
        { id: { [Op.ne]: req.user.id } }
      ]
    };

    const users = await User.findAll({
      where: finalWhere,
      attributes: ['id', 'name', 'email', 'avatar', 'role', 'status'],
      order: [['name', 'ASC']]
    });

    res.json(users);
  } catch (err) {
    console.error('[API] Error fetching chat users', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get total unread messages for the current user
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    const count = await SupportMessage.count({
      where: {
        receiverId: req.user.id,
        isRead: false
      }
    });

    const bySenderRaw = await SupportMessage.findAll({
      where: {
        receiverId: req.user.id,
        isRead: false
      },
      attributes: ['senderId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['senderId']
    });

    const bySender = {};
    bySenderRaw.forEach(row => {
      bySender[row.senderId] = parseInt(row.get('count'), 10);
    });

    res.json({ total: count, bySender });
  } catch (err) {
    console.error('[API] Error fetching unread count', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/chat/mark-read/:senderId
// @desc    Mark all messages from a specific sender to the current user as read
// @access  Private
router.put('/mark-read/:senderId', auth, async (req, res) => {
  try {
    await SupportMessage.update(
      { isRead: true },
      {
        where: {
          receiverId: req.user.id,
          senderId: req.params.senderId,
          isRead: false
        }
      }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[API] Error marking messages read', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
