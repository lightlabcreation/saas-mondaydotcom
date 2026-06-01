const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const verifyTenant = require('../middleware/verifyTenant');
const { CompanyBackup, Board, Group, Item, User, File, TimeSession, sequelize } = require('../models');

// @route   POST api/backups/create
// @desc    Create a snapshot backup of the entire company data
router.post('/create', [auth, verifyTenant], async (req, res) => {
  const companyId = req.user.companyId;

  // Only Admin or Manager should take backups
  if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
    return res.status(403).json({ msg: 'Access denied: Only Admins can take backups.' });
  }

  try {
    // 1. Fetch all company data
    const boards = await Board.findAll({ where: { companyId } });
    const groups = await Group.findAll({ where: { companyId } });
    const items = await Item.findAll({ where: { companyId } });
    const files = await File.findAll({ where: { companyId } });
    const users = await User.findAll({ where: { companyId }, attributes: { exclude: ['password'] } });
    const timeSessions = await TimeSession.findAll({ where: { companyId } });

    // 2. Combine into one JSON payload
    const backupData = {
      boards,
      groups,
      items,
      files,
      users,
      timeSessions,
      timestamp: new Date().toISOString()
    };

    // Calculate approximate size
    const sizeInBytes = Buffer.byteLength(JSON.stringify(backupData));
    const backupSize = (sizeInBytes / 1024 / 1024).toFixed(2) + ' MB';

    // 3. Save to database
    const backup = await CompanyBackup.create({
      companyId,
      createdBy: req.user.id,
      backupName: `Backup_${new Date().toISOString().split('T')[0]}`,
      backupSize,
      backupData
    });

    res.json({ msg: 'Backup created successfully', backupId: backup.id, size: backupSize });
  } catch (err) {
    console.error('[BACKUP ERROR]', err);
    res.status(500).json({ msg: 'Server error during backup creation' });
  }
});

// @route   GET api/backups/list
// @desc    Get all backups for this company
router.get('/list', [auth, verifyTenant], async (req, res) => {
  try {
    // Return everything except the massive JSON data for the list view
    const backups = await CompanyBackup.findAll({
      where: { companyId: req.user.companyId },
      attributes: { exclude: ['backupData'] },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['name', 'email'] }]
    });
    res.json(backups);
  } catch (err) {
    res.status(500).json({ msg: 'Server error fetching backups' });
  }
});

// @route   POST api/backups/restore/:id
// @desc    Restore missing data from a backup snapshot
router.post('/restore/:id', [auth, verifyTenant], async (req, res) => {
  const backupId = req.params.id;
  const companyId = req.user.companyId;

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ msg: 'Access denied: Only Admins can restore data.' });
  }

  try {
    const backup = await CompanyBackup.findOne({
      where: { id: backupId, companyId }
    });

    if (!backup) {
      return res.status(404).json({ msg: 'Backup not found or does not belong to your company.' });
    }

    const data = backup.backupData; // The massive JSON object

    // Use a Transaction to ensure if something fails, nothing gets corrupted
    await sequelize.transaction(async (t) => {
      
      // Example Restore Logic: We use 'upsert' or 'ignoreDuplicates' 
      // so we don't break existing data, but only put back what was deleted.
      
      if (data.boards && data.boards.length > 0) {
        await Board.bulkCreate(data.boards, { updateOnDuplicate: ['name', 'isArchived'], transaction: t });
      }

      if (data.groups && data.groups.length > 0) {
        await Group.bulkCreate(data.groups, { updateOnDuplicate: ['title'], transaction: t });
      }

      if (data.items && data.items.length > 0) {
        await Item.bulkCreate(data.items, { updateOnDuplicate: ['name', 'status', 'isArchived'], transaction: t });
      }

    });

    res.json({ msg: 'Data restored successfully from snapshot!' });
  } catch (err) {
    console.error('[RESTORE ERROR]', err);
    res.status(500).json({ msg: 'Server error during restoration', error: err.message });
  }
});

module.exports = router;
