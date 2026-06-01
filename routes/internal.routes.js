const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Role, Company, Subscription, Permission } = require('../models');
const internalApiKeyMiddleware = require('../middleware/internalApiKeyMiddleware');

/**
 * @route   GET api/internal/master/verify-subscription
 * @desc    Mock Superadmin Subscription Verification endpoint for local testing
 */
router.get('/master/verify-subscription', async (req, res) => {
  const { email } = req.query;
  console.log(`[MOCK SUPERADMIN API] Subscription verification requested for: ${email}`);

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email query parameter is required.' });
  }

  // Trigger suspension block if email contains 'suspended'
  if (email.includes('suspended')) {
    return res.status(403).json({
      success: false,
      message: 'Subscription has been suspended by Superadmin.'
    });
  }

  // Trigger validation failure if email contains 'expired'
  if (email.includes('expired')) {
    return res.json({
      success: false,
      message: 'Subscription has expired.'
    });
  }

  // Trigger server error if email contains 'error'
  if (email.includes('error')) {
    return res.status(500).json({
      success: false,
      message: 'Mock Superadmin Internal Server Error.'
    });
  }

  // Otherwise, default to success
  return res.json({
    success: true,
    message: 'Subscription is active.'
  });
});

/**
 * @route   POST api/internal/provision-company
 * @desc    Provision a new company (tenant) and its associated admin user
 */
router.post('/provision-company', internalApiKeyMiddleware, async (req, res) => {
  const { companyName, email, password, phone, planName } = req.body;

  // Validate required input fields
  if (!companyName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide companyName, email, and password.'
    });
  }

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    // Generate unique domain name for company
    let domainName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!domainName) {
      domainName = 'company' + Math.floor(1000 + Math.random() * 9000);
    }
    
    // Check if domain name is already taken, if so, append suffix to maintain uniqueness
    const existingCompany = await Company.findOne({ where: { domain: domainName } });
    if (existingCompany) {
      domainName = domainName + Math.floor(1000 + Math.random() * 9000);
    }

    // 2. Create the Company record
    const company = await Company.create({
      name: companyName,
      domain: domainName,
      status: 'active'
    });

    // 3. Seed Default Roles for this new company to maintain permission compatibility
    const permsDefinitions = await Permission.findAll();
    const defaultPermsMap = {};
    permsDefinitions.forEach(p => defaultPermsMap[p.key] = false);
    const adminPerms = {};
    permsDefinitions.forEach(p => adminPerms[p.key] = true);

    const rolesToCreate = [
      { name: 'Admin', permissions: adminPerms, isCustom: false, companyId: company.id },
      { name: 'Member', permissions: defaultPermsMap, isCustom: false, companyId: company.id },
      { name: 'Viewer', permissions: defaultPermsMap, isCustom: false, companyId: company.id },
      { name: 'Guest', permissions: defaultPermsMap, isCustom: false, companyId: company.id },
    ];
    const createdRoles = await Role.bulkCreate(rolesToCreate, { ignoreDuplicates: true });
    
    // Retrieve the admin role instance for mapping
    const adminRole = createdRoles.find(r => r.name === 'Admin') || 
                      await Role.findOne({ where: { name: 'Admin', companyId: company.id } });

    // 4. Determine subscription plan type and create a Subscription record
    let dbPlanType = 'Starter';
    if (planName) {
      const lowerPlan = planName.toLowerCase();
      if (lowerPlan.includes('pro') || lowerPlan.includes('premium')) {
        dbPlanType = 'Pro';
      } else if (lowerPlan.includes('enterprise')) {
        dbPlanType = 'Enterprise';
      }
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30 days active trial/provisioned period

    await Subscription.create({
      companyId: company.id,
      planType: dbPlanType,
      status: 'active',
      trialEndsAt
    });

    // 5. Hash the plain text password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Create the Admin User linked to company and role
    const user = await User.create({
      name: companyName + ' Admin',
      email: email,
      password: hashedPassword,
      role: 'Admin',
      roleId: adminRole ? adminRole.id : null,
      companyId: company.id,
      phone: phone || null,
      status: 'active'
    });

    // Return the required success payload
    return res.status(201).json({
      success: true,
      companyId: company.id,
      userId: user.id
    });

  } catch (err) {
    console.error('[PROVISION COMPANY ERROR]', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error during company provisioning'
    });
  }
});

/**
 * @route   POST api/internal/toggle-status
 * @desc    Toggle company account status between active and suspended
 */
router.post('/toggle-status', internalApiKeyMiddleware, async (req, res) => {
  const { email, status } = req.body;

  if (!email || !status) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and status.'
    });
  }

  // Validate status parameter
  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({
      success: false,
      message: "Status must be either 'active' or 'suspended'."
    });
  }

  try {
    // Find the company's owner/admin user by email
    const user = await User.findOne({
      where: { email },
      include: [Company]
    });

    if (!user || !user.Company) {
      return res.status(404).json({
        success: false,
        message: 'Employer or Company not found for the provided email.'
      });
    }

    // Update the company status field and save changes
    const company = user.Company;
    company.status = status;
    await company.save();

    console.log(`[TOGGLE STATUS] Company ${company.name} (ID: ${company.id}) set to: ${status}`);

    return res.json({
      success: true,
      message: `Company status has been successfully updated to ${status}`
    });

  } catch (err) {
    console.error('[TOGGLE STATUS ERROR]', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error during status update'
    });
  }
});

module.exports = router;
