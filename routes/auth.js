const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, Company, Subscription, Board, Item } = require('../models');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  // Hot-reload env variables dynamically on request
  require('dotenv').config();
  const { email, password, captchaToken } = req.body;

  console.log('[LOGIN] Request received:', { email, passwordProvided: !!password });

  // Validate input
  if (!email || !password) {
    console.log('[LOGIN] Missing email or password');
    return res.status(400).json({ msg: 'Please provide both email and password' });
  }

  // Google reCAPTCHA Verification
  const isDev = process.env.NODE_ENV === 'development';
  const hasSecretKey = !!process.env.RECAPTCHA_SECRET_KEY;
  const isBypassToken = captchaToken === 'dev_bypass_token';

  if (isDev && (!hasSecretKey || isBypassToken)) {
    console.log('[LOGIN] reCAPTCHA verification bypassed (Development Mode)');
  } else {
    if (!hasSecretKey) {
      console.warn('[LOGIN] Missing RECAPTCHA_SECRET_KEY in production mode!');
      return res.status(500).json({ msg: 'Server configuration error: missing reCAPTCHA secret key.' });
    }
    if (!captchaToken || isBypassToken) {
      console.warn('[LOGIN] Blocked invalid/bypass token in verification mode:', captchaToken);
      return res.status(400).json({ msg: 'Please verify that you are not a robot.' });
    }
    try {
      const axios = require('axios');
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
      const captchaRes = await axios.post(verifyUrl);
      if (!captchaRes.data || !captchaRes.data.success) {
        console.warn('[LOGIN] reCAPTCHA verification failed:', captchaRes.data);
        return res.status(400).json({ msg: 'reCAPTCHA verification failed. Please try again.' });
      }
      console.log('[LOGIN] reCAPTCHA validation successful');
    } catch (captchaErr) {
      console.error('[LOGIN] reCAPTCHA API request error:', captchaErr.message);
      return res.status(500).json({ msg: 'Server error during reCAPTCHA verification' });
    }
  }

  try {
    const { Role } = require('../models');
    let user = await User.findOne({
      where: { email },
      include: [{ model: Role }, { model: Company, include: [Subscription] }]
    });
    console.log('[LOGIN] User lookup result:', user ? `Found user: ${user.email}` : 'User not found');

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] Password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Local company status check (active / suspended)
    if (user.role !== 'Superadmin' && user.Company && user.Company.status === 'suspended') {
      return res.status(403).json({ msg: 'Company account is suspended. Please contact support.' });
    }

    // Outgoing subscription verification to Superadmin Master API
    if (user.role !== 'Superadmin') {
      const axios = require('axios');
      let employerEmail = user.email;
      if (user.role !== 'Admin') {
        const adminUser = await User.findOne({
          where: { companyId: user.companyId, role: 'Admin' }
        });
        if (adminUser) {
          employerEmail = adminUser.email;
        }
      }

      console.log(`[LOGIN] Verifying subscription for employer: ${employerEmail}`);

      const superadminApiUrl = process.env.SUPERADMIN_API_URL;
      if (!superadminApiUrl) {
        console.error('[LOGIN] SUPERADMIN_API_URL environment variable is not defined.');
        return res.status(500).json({ msg: 'Configuration error: Superadmin API URL is missing.' });
      }

      const verifyUrl = `${superadminApiUrl}/master/verify-subscription?email=${encodeURIComponent(employerEmail)}`;

      try {
        const response = await axios.get(verifyUrl);
        if (response.data && response.data.success === false) {
          return res.status(403).json({
            msg: response.data.message || 'Subscription verification failed.'
          });
        }
      } catch (axiosError) {
        if (axiosError.response) {
          if (axiosError.response.status === 403) {
            return res.status(403).json({
              msg: axiosError.response.data?.message || 'Subscription verification failed.'
            });
          }
          console.error('[LOGIN] Superadmin API returned non-2xx status:', axiosError.response.status, axiosError.response.data);
          return res.status(500).json({ msg: 'Superadmin API verification returned an error.' });
        } else {
          console.error('[LOGIN] Superadmin API is unreachable:', axiosError.message);
          return res.status(500).json({ msg: 'Superadmin API is unreachable.' });
        }
      }
    }

    // Merge permissions: Role permissions + User-specific overrides
    let basePermissions = {};
    if (user.Role && user.Role.permissions) {
      basePermissions = typeof user.Role.permissions === 'string'
        ? JSON.parse(user.Role.permissions)
        : user.Role.permissions;
    }

    let userPermissions = {};
    if (user.permissions) {
      userPermissions = typeof user.permissions === 'string'
        ? JSON.parse(user.permissions)
        : user.permissions;
    }

    const mergedPermissions = { ...basePermissions, ...userPermissions };

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        companyId: user.companyId
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10h' }, (err, token) => {
      if (err) {
        console.error('[LOGIN] JWT signing error:', err);
        throw err;
      }
      console.log('[LOGIN] Login successful for:', user.email);
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleId: user.roleId,
          avatar: user.avatar,
          companyId: user.companyId,
          permissions: mergedPermissions,
          subscription: user.Company && user.Company.Subscription ? user.Company.Subscription : null
        }
      });
    });
  } catch (err) {
    console.error('[LOGIN] Server error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/register-tenant
// @desc    Register a new company (tenant) and admin user
router.post('/register-tenant', async (req, res) => {
  const { name, email, password, companyName, phone, country, industry, companySize, plan } = req.body;

  if (!name || !email || !password || !companyName) {
    return res.status(400).json({ message: 'Please enter all required fields.' });
  }

  try {
    // 1. Check if user already exists
    let userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    // 2. Create Company
    const company = await Company.create({
      name: companyName,
      status: 'active'
    });

    // 3. Determine Plan Type and Subscription Status
    let planType = 'Starter';
    if (plan === 'gold') planType = 'Pro';
    if (plan === 'diamond') planType = 'Enterprise';

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // Create Subscription
    await Subscription.create({
      companyId: company.id,
      planType,
      status: plan === 'silver' ? 'trial' : 'active',
      trialEndsAt
    });

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create User as Admin of the new company
    const adminPermissions = {
      view_boards: true,
      create_boards: true,
      edit_boards: true,
      delete_boards: true,
      manage_users: true,
      manage_roles: true,
      view_payroll: true,
      manage_payroll: true,
      view_time_tracking: true
    };

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'Admin',
      companyId: company.id,
      phone: phone || null,
      address: country || null,
      permissions: adminPermissions
    });

    // 6. Seed initial template folders and boards for a new company
    const board1 = await Board.create({ 
      name: 'Main Workspace Board', 
      companyId: company.id, 
      folder: 'General',
      columns: [
        { id: 'name', title: 'Item', type: 'text' },
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'priority', title: 'Priority', type: 'priority' },
        { id: 'timeline', title: 'Timeline', type: 'timeline' }
      ]
    });

    // Seed default items
    await Item.create({ name: 'Welcome to your monday workspace!', status: 'Working on it', priority: 'Medium', companyId: company.id, BoardId: board1.id });
    await Item.create({ name: 'Set up your project columns', status: 'Done', priority: 'High', companyId: company.id, BoardId: board1.id });

    return res.status(201).json({
      success: true,
      message: 'Company registered successfully.',
      companyId: company.id,
      userId: user.id
    });
  } catch (err) {
    console.error('[REGISTER-TENANT] Server error:', err);
    return res.status(500).json({ message: err.message || 'Server error during tenant registration.' });
  }
});


// @route   POST api/auth/demo-setup
// @desc    Setup a 7-day trial demo account instantly with mock data
router.post('/demo-setup', async (req, res) => {
  try {
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const demoCompanyName = `Demo Corp ${uniqueSuffix}`;
    const demoEmail = `demo${uniqueSuffix}@example.com`;
    const demoPassword = 'demo' + uniqueSuffix; // Although they login automatically

    // 1. Create Demo Company
    const company = await Company.create({
      name: demoCompanyName,
      isDemo: true
    });

    // 2. Create Trial Subscription (7 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    await Subscription.create({
      companyId: company.id,
      planType: 'Pro',
      status: 'trial',
      trialEndsAt
    });

    // 3. Create Demo User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(demoPassword, salt);

    const user = await User.create({
      name: 'Demo Admin',
      email: demoEmail,
      password: hashedPassword,
      role: 'Admin',
      companyId: company.id
    });

    // 4. Seed Mock Data
    const board1 = await Board.create({ name: 'Project Alpha', companyId: company.id, folder: 'Active Projects' });
    const board2 = await Board.create({ name: 'Sales Pipeline', companyId: company.id, folder: 'Commercial' });

    await Item.create({ name: 'Setup Infrastructure', status: 'Working on it', companyId: company.id, BoardId: board1.id });
    await Item.create({ name: 'Design Homepage', status: 'Done', companyId: company.id, BoardId: board1.id });
    await Item.create({ name: 'Lead: Acme Corp', status: 'Negotiation', companyId: company.id, BoardId: board2.id });
    await Item.create({ name: 'Lead: Globex', status: 'New Lead', companyId: company.id, BoardId: board2.id });
    await Item.create({ name: 'Lead: Initech', status: 'Won', companyId: company.id, BoardId: board2.id });

    // 5. Generate Token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        companyId: user.companyId
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10h' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          subscription: { trialEndsAt, status: 'trial' }
        }
      });
    });

  } catch (err) {
    console.error('[DEMO-SETUP] Error:', err);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

module.exports = router;
