/**
 * seedProperData.js
 * Resets and seeds all boards, groups, items for companyId=1 (admin@gmail.com)
 * Run: node seedProperData.js
 */
require('dotenv').config();
const { Board, Group, Item, sequelize } = require('./models');

const COMPANY_ID = 1;
const ADMIN_USER_ID = '1';
const USER_IDS = ['1', '2', '3', '7', '8', '9', '10', '11'];

async function clearOldData() {
  console.log('🗑  Clearing old boards/groups/items for company 1...');
  // Delete items first (FK constraint)
  await sequelize.query(`DELETE FROM items WHERE companyId = ${COMPANY_ID} AND parentItemId IS NULL`);
  await sequelize.query(`DELETE FROM groups WHERE companyId = ${COMPANY_ID}`);
  await sequelize.query(`DELETE FROM boards WHERE companyId = ${COMPANY_ID}`);
  console.log('✅ Cleared.\n');
}

async function createBoard(name, folder, columns = null) {
  return Board.create({
    name,
    folder,
    companyId: COMPANY_ID,
    ownerId: ADMIN_USER_ID,
    columns: columns ? JSON.stringify(columns) : null,
  });
}

async function createGroup(boardId, title, color) {
  return Group.create({ title, color, BoardId: boardId, companyId: COMPANY_ID });
}

async function createItem(groupId, boardId, data) {
  return Item.create({
    companyId: COMPANY_ID,
    GroupId: groupId,
    BoardId: boardId,
    assignedToId: ADMIN_USER_ID,
    updates: '[]',
    filesData: '[]',
    activity: '[]',
    subItemsData: '[]',
    ...data,
  });
}

async function seed() {
  try {
    await clearOldData();

    // ══════════════════════════════════════════════════════
    // BOARD 1: Main Project Board (Active Projects)
    // ══════════════════════════════════════════════════════
    console.log('📋 Creating: Main Project Board...');
    const mainBoard = await createBoard('Main Project Board', 'Active Projects', [
      { id: 'name', title: 'Task', type: 'text' },
      { id: 'status', title: 'Status', type: 'status' },
      { id: 'priority', title: 'Priority', type: 'priority' },
      { id: 'assignedToId', title: 'Assigned To', type: 'person' },
      { id: 'timeline', title: 'Timeline', type: 'text' },
      { id: 'progress', title: 'Progress', type: 'progress' },
    ]);

    const g1 = await createGroup(mainBoard.id, 'Planning', '#579bfc');
    await createItem(g1.id, mainBoard.id, { name: 'Project Kickoff Meeting', status: 'Done', priority: 'High', progress: 100, timeline: 'May 1 - May 2', assignedToId: '1' });
    await createItem(g1.id, mainBoard.id, { name: 'Requirements Gathering', status: 'Done', priority: 'High', progress: 100, timeline: 'May 3 - May 7', assignedToId: '3' });
    await createItem(g1.id, mainBoard.id, { name: 'System Architecture Design', status: 'Working on it', priority: 'Critical', progress: 65, timeline: 'May 8 - May 15', assignedToId: '9' });
    await createItem(g1.id, mainBoard.id, { name: 'Tech Stack Finalization', status: 'Done', priority: 'Medium', progress: 100, timeline: 'May 5 - May 6', assignedToId: '1' });

    const g2 = await createGroup(mainBoard.id, 'Development', '#00c875');
    await createItem(g2.id, mainBoard.id, { name: 'Frontend UI Design', status: 'Working on it', priority: 'High', progress: 70, timeline: 'May 10 - May 25', assignedToId: '7' });
    await createItem(g2.id, mainBoard.id, { name: 'Backend API Development', status: 'Working on it', priority: 'Critical', progress: 55, timeline: 'May 10 - May 30', assignedToId: '1' });
    await createItem(g2.id, mainBoard.id, { name: 'Database Schema Setup', status: 'Done', priority: 'High', progress: 100, timeline: 'May 8 - May 10', assignedToId: '9' });
    await createItem(g2.id, mainBoard.id, { name: 'Authentication Module', status: 'Done', priority: 'High', progress: 100, timeline: 'May 12 - May 14', assignedToId: '1' });
    await createItem(g2.id, mainBoard.id, { name: 'Dashboard Component', status: 'Working on it', priority: 'Medium', progress: 40, timeline: 'May 20 - May 28', assignedToId: '7' });
    await createItem(g2.id, mainBoard.id, { name: 'Notification System', status: 'Not Started', priority: 'Low', progress: 0, timeline: 'May 28 - Jun 5', assignedToId: '3' });

    const g3 = await createGroup(mainBoard.id, 'Testing & QA', '#fdab3d');
    await createItem(g3.id, mainBoard.id, { name: 'Unit Test Coverage', status: 'Working on it', priority: 'High', progress: 30, timeline: 'May 25 - Jun 5', assignedToId: '8' });
    await createItem(g3.id, mainBoard.id, { name: 'Integration Testing', status: 'Not Started', priority: 'High', progress: 0, timeline: 'Jun 1 - Jun 10', assignedToId: '8' });
    await createItem(g3.id, mainBoard.id, { name: 'Bug Fixing Sprint', status: 'Not Started', priority: 'Critical', progress: 0, timeline: 'Jun 8 - Jun 15', assignedToId: '1' });
    await createItem(g3.id, mainBoard.id, { name: 'User Acceptance Testing', status: 'Not Started', priority: 'Medium', progress: 0, timeline: 'Jun 14 - Jun 20', assignedToId: '7' });

    const g4 = await createGroup(mainBoard.id, 'Deployment', '#e2445c');
    await createItem(g4.id, mainBoard.id, { name: 'Staging Server Setup', status: 'Done', priority: 'High', progress: 100, timeline: 'May 20 - May 21', assignedToId: '9' });
    await createItem(g4.id, mainBoard.id, { name: 'CI/CD Pipeline Config', status: 'Working on it', priority: 'High', progress: 50, timeline: 'May 22 - May 28', assignedToId: '9' });
    await createItem(g4.id, mainBoard.id, { name: 'Production Deployment', status: 'Not Started', priority: 'Critical', progress: 0, timeline: 'Jun 20 - Jun 22', assignedToId: '1' });

    console.log('  ✅ Main Project Board done.\n');

    // ══════════════════════════════════════════════════════
    // BOARD 2: Website Redesign (Active Projects)
    // ══════════════════════════════════════════════════════
    console.log('📋 Creating: Website Redesign...');
    const webBoard = await createBoard('Website Redesign', 'Active Projects', [
      { id: 'name', title: 'Task', type: 'text' },
      { id: 'status', title: 'Status', type: 'status' },
      { id: 'priority', title: 'Priority', type: 'priority' },
      { id: 'assignedToId', title: 'Owner', type: 'person' },
      { id: 'expectedSubmissionDate', title: 'Due Date', type: 'date' },
      { id: 'progress', title: 'Progress', type: 'progress' },
    ]);

    const w1 = await createGroup(webBoard.id, 'Design Phase', '#a25ddc');
    await createItem(w1.id, webBoard.id, { name: 'Homepage Wireframe', status: 'Done', priority: 'High', progress: 100, expectedSubmissionDate: '2026-05-10', assignedToId: '7' });
    await createItem(w1.id, webBoard.id, { name: 'Color Palette & Branding', status: 'Done', priority: 'Medium', progress: 100, expectedSubmissionDate: '2026-05-12', assignedToId: '7' });
    await createItem(w1.id, webBoard.id, { name: 'Mobile Responsive Design', status: 'Working on it', priority: 'High', progress: 60, expectedSubmissionDate: '2026-05-28', assignedToId: '7' });
    await createItem(w1.id, webBoard.id, { name: 'UI Component Library', status: 'Working on it', priority: 'High', progress: 45, expectedSubmissionDate: '2026-05-30', assignedToId: '3' });

    const w2 = await createGroup(webBoard.id, 'Development', '#00c875');
    await createItem(w2.id, webBoard.id, { name: 'Landing Page HTML/CSS', status: 'Working on it', priority: 'High', progress: 70, expectedSubmissionDate: '2026-06-05', assignedToId: '1' });
    await createItem(w2.id, webBoard.id, { name: 'About Us Page', status: 'Not Started', priority: 'Medium', progress: 0, expectedSubmissionDate: '2026-06-08', assignedToId: '3' });
    await createItem(w2.id, webBoard.id, { name: 'Contact Form Integration', status: 'Not Started', priority: 'Low', progress: 0, expectedSubmissionDate: '2026-06-10', assignedToId: '1' });

    const w3 = await createGroup(webBoard.id, 'Content & SEO', '#fdab3d');
    await createItem(w3.id, webBoard.id, { name: 'Copy Writing - Homepage', status: 'Done', priority: 'High', progress: 100, expectedSubmissionDate: '2026-05-15', assignedToId: '11' });
    await createItem(w3.id, webBoard.id, { name: 'SEO Meta Tags Setup', status: 'Working on it', priority: 'Medium', progress: 50, expectedSubmissionDate: '2026-05-28', assignedToId: '11' });
    await createItem(w3.id, webBoard.id, { name: 'Google Analytics Integration', status: 'Not Started', priority: 'Low', progress: 0, expectedSubmissionDate: '2026-06-12', assignedToId: '9' });

    console.log('  ✅ Website Redesign done.\n');

    // ══════════════════════════════════════════════════════
    // BOARD 3: AI Future Projects (AI & Innovation)
    // ══════════════════════════════════════════════════════
    console.log('📋 Creating: AI Future Projects...');
    const aiBoard = await createBoard('AI Future Projects', 'AI & Innovation', [
      { id: 'name', title: 'Project', type: 'text' },
      { id: 'status', title: 'Status', type: 'status', options: [
        { label: 'Research', color: '#0085ff' },
        { label: 'POC', color: '#fdab3d' },
        { label: 'MVP', color: '#a25ddc' },
        { label: 'Production', color: '#00c875' },
        { label: 'On Hold', color: '#c4c4c4' },
      ]},
      { id: 'aiModel', title: 'AI Model', type: 'status', options: [
        { label: 'GPT-4', color: '#74aa9c' },
        { label: 'Claude', color: '#d97757' },
        { label: 'Gemini', color: '#4285f4' },
        { label: 'Vision', color: '#33adff' },
        { label: 'Custom', color: '#a25ddc' },
      ]},
      { id: 'priority', title: 'Priority', type: 'priority' },
      { id: 'progress', title: 'Progress', type: 'progress' },
      { id: 'assignedToId', title: 'Lead', type: 'person' },
    ]);

    const ai1 = await createGroup(aiBoard.id, 'Active Research', '#0085ff');
    await createItem(ai1.id, aiBoard.id, { name: 'Multimodal AI Assistant', status: 'Research', aiModel: 'GPT-4', priority: 'Critical', progress: 25, assignedToId: '1' });
    await createItem(ai1.id, aiBoard.id, { name: 'Real-time Translation Engine', status: 'POC', aiModel: 'Custom', priority: 'High', progress: 40, assignedToId: '9' });
    await createItem(ai1.id, aiBoard.id, { name: 'Smart Document Analyzer', status: 'POC', aiModel: 'Gemini', priority: 'High', progress: 35, assignedToId: '3' });
    await createItem(ai1.id, aiBoard.id, { name: 'Voice Command Interface', status: 'Research', aiModel: 'GPT-4', priority: 'Medium', progress: 15, assignedToId: '1' });

    const ai2 = await createGroup(aiBoard.id, 'In Development', '#a25ddc');
    await createItem(ai2.id, aiBoard.id, { name: 'AI Chatbot for Support', status: 'MVP', aiModel: 'Claude', priority: 'High', progress: 65, assignedToId: '1' });
    await createItem(ai2.id, aiBoard.id, { name: 'Predictive Analytics Dashboard', status: 'MVP', aiModel: 'Custom', priority: 'Critical', progress: 55, assignedToId: '9' });
    await createItem(ai2.id, aiBoard.id, { name: 'Local LLM on Edge Devices', status: 'POC', aiModel: 'Custom', priority: 'Medium', progress: 30, assignedToId: '3' });

    const ai3 = await createGroup(aiBoard.id, 'In Production', '#00c875');
    await createItem(ai3.id, aiBoard.id, { name: 'Smart Document Parser', status: 'Production', aiModel: 'Vision', priority: 'Medium', progress: 100, assignedToId: '1' });
    await createItem(ai3.id, aiBoard.id, { name: 'Automated QA Agent', status: 'Production', aiModel: 'GPT-4', priority: 'Low', progress: 100, assignedToId: '9' });

    const ai4 = await createGroup(aiBoard.id, 'On Hold', '#c4c4c4');
    await createItem(ai4.id, aiBoard.id, { name: 'Neural Search Engine', status: 'On Hold', aiModel: 'Custom', priority: 'Low', progress: 10, assignedToId: '1' });

    console.log('  ✅ AI Future Projects done.\n');

    // ══════════════════════════════════════════════════════
    // BOARD 4: AI R&D Roadmap (AI & Innovation)
    // ══════════════════════════════════════════════════════
    console.log('📋 Creating: AI R&D Roadmap...');
    const aiRoadmapBoard = await createBoard('AI R&D Roadmap', 'AI & Innovation', [
      { id: 'name', title: 'Initiative', type: 'text' },
      { id: 'status', title: 'Status', type: 'status' },
      { id: 'priority', title: 'Priority', type: 'priority' },
      { id: 'timeline', title: 'Timeline', type: 'text' },
      { id: 'progress', title: 'Progress', type: 'progress' },
      { id: 'assignedToId', title: 'Owner', type: 'person' },
    ]);

    const r1 = await createGroup(aiRoadmapBoard.id, 'Q2 2026', '#0085ff');
    await createItem(r1.id, aiRoadmapBoard.id, { name: 'LLM Integration Framework', status: 'Working on it', priority: 'Critical', timeline: 'Apr - Jun 2026', progress: 50, assignedToId: '1' });
    await createItem(r1.id, aiRoadmapBoard.id, { name: 'AI Safety Audit', status: 'Working on it', priority: 'High', timeline: 'May - Jun 2026', progress: 30, assignedToId: '9' });
    await createItem(r1.id, aiRoadmapBoard.id, { name: 'Model Fine-tuning Pipeline', status: 'Not Started', priority: 'High', timeline: 'Jun 2026', progress: 0, assignedToId: '3' });

    const r2 = await createGroup(aiRoadmapBoard.id, 'Q3 2026', '#a25ddc');
    await createItem(r2.id, aiRoadmapBoard.id, { name: 'Multimodal Model Testing', status: 'Not Started', priority: 'Critical', timeline: 'Jul - Aug 2026', progress: 0, assignedToId: '1' });
    await createItem(r2.id, aiRoadmapBoard.id, { name: 'Edge AI Deployment', status: 'Not Started', priority: 'Medium', timeline: 'Aug - Sep 2026', progress: 0, assignedToId: '9' });
    await createItem(r2.id, aiRoadmapBoard.id, { name: 'AI Performance Benchmarking', status: 'Not Started', priority: 'High', timeline: 'Sep 2026', progress: 0, assignedToId: '3' });

    const r3 = await createGroup(aiRoadmapBoard.id, 'Q4 2026', '#00c875');
    await createItem(r3.id, aiRoadmapBoard.id, { name: 'Production AI Platform v2', status: 'Not Started', priority: 'Critical', timeline: 'Oct - Dec 2026', progress: 0, assignedToId: '1' });
    await createItem(r3.id, aiRoadmapBoard.id, { name: 'AI Ethics Review', status: 'Not Started', priority: 'Medium', timeline: 'Nov 2026', progress: 0, assignedToId: '9' });

    console.log('  ✅ AI R&D Roadmap done.\n');

    // ══════════════════════════════════════════════════════
    // BOARD 5: Commercial - SIRA (Commercial)
    // ══════════════════════════════════════════════════════
    console.log('📋 Creating: Commercial - SIRA...');
    const siraBoard = await createBoard('Commercial - SIRA', 'Commercial', [
      { id: 'name', title: 'Deal / Client', type: 'text' },
      { id: 'status', title: 'Stage', type: 'status', options: [
        { label: 'New Lead', color: '#579bfc' },
        { label: 'Contacted', color: '#a25ddc' },
        { label: 'Proposal Sent', color: '#fdab3d' },
        { label: 'Negotiation', color: '#0085ff' },
        { label: 'Working on it', color: '#fdab3d' },
        { label: 'Won', color: '#00c875' },
        { label: 'Lost', color: '#e2445c' },
      ]},
      { id: 'dealValue', title: 'Deal Value (AED)', type: 'text' },
      { id: 'priority', title: 'Priority', type: 'priority' },
      { id: 'assignedToId', title: 'Sales Rep', type: 'person' },
      { id: 'expectedSubmissionDate', title: 'Expected Close', type: 'date' },
      { id: 'progress', title: 'Progress', type: 'progress' },
    ]);

    const s1 = await createGroup(siraBoard.id, 'Active Deals', '#00c875');
    await createItem(s1.id, siraBoard.id, { name: 'Al Ghurair Centre - SIRA Renewal', status: 'Negotiation', dealValue: '120000', priority: 'High', progress: 70, expectedSubmissionDate: '2026-06-15', assignedToId: '1' });
    await createItem(s1.id, siraBoard.id, { name: 'Dubai Mall - Security System', status: 'Proposal Sent', dealValue: '250000', priority: 'Critical', progress: 40, expectedSubmissionDate: '2026-06-20', assignedToId: '9' });
    await createItem(s1.id, siraBoard.id, { name: 'Marina Gate Towers', status: 'Negotiation', dealValue: '185000', priority: 'High', progress: 60, expectedSubmissionDate: '2026-07-01', assignedToId: '1' });
    await createItem(s1.id, siraBoard.id, { name: 'Burj Khalifa Security Upgrade', status: 'Contacted', dealValue: '450000', priority: 'Critical', progress: 20, expectedSubmissionDate: '2026-07-15', assignedToId: '9' });
    await createItem(s1.id, siraBoard.id, { name: 'JBR Walk Surveillance', status: 'Working on it', dealValue: '95000', priority: 'Medium', progress: 35, expectedSubmissionDate: '2026-06-28', assignedToId: '1' });

    const s2 = await createGroup(siraBoard.id, 'New Leads', '#579bfc');
    await createItem(s2.id, siraBoard.id, { name: 'DIFC - Office Complex', status: 'New Lead', dealValue: '320000', priority: 'High', progress: 5, expectedSubmissionDate: '2026-08-01', assignedToId: '1' });
    await createItem(s2.id, siraBoard.id, { name: 'Palm Jumeirah Villa Estate', status: 'New Lead', dealValue: '180000', priority: 'Medium', progress: 5, expectedSubmissionDate: '2026-08-15', assignedToId: '9' });
    await createItem(s2.id, siraBoard.id, { name: 'Emirates Towers - Access Control', status: 'Contacted', dealValue: '210000', priority: 'High', progress: 10, expectedSubmissionDate: '2026-07-20', assignedToId: '1' });

    const s3 = await createGroup(siraBoard.id, 'Closed Won', '#00c875');
    await createItem(s3.id, siraBoard.id, { name: 'Marina Gate - Complete Installation', status: 'Won', dealValue: '340000', priority: 'High', progress: 100, expectedSubmissionDate: '2026-04-15', assignedToId: '1' });
    await createItem(s3.id, siraBoard.id, { name: 'Downtown Blvd - CCTV Setup', status: 'Won', dealValue: '125000', priority: 'Medium', progress: 100, expectedSubmissionDate: '2026-04-01', assignedToId: '9' });
    await createItem(s3.id, siraBoard.id, { name: 'Deira City Centre - Renewal', status: 'Won', dealValue: '88000', priority: 'Medium', progress: 100, expectedSubmissionDate: '2026-03-20', assignedToId: '1' });

    const s4 = await createGroup(siraBoard.id, 'Lost Deals', '#e2445c');
    await createItem(s4.id, siraBoard.id, { name: 'Mirdif City Centre - Budget Issue', status: 'Lost', dealValue: '220000', priority: 'Low', progress: 0, expectedSubmissionDate: '2026-04-10', assignedToId: '9' });
    await createItem(s4.id, siraBoard.id, { name: 'Jumeirah Golf Estates', status: 'Lost', dealValue: '145000', priority: 'Low', progress: 0, expectedSubmissionDate: '2026-05-05', assignedToId: '1' });

    console.log('  ✅ Commercial - SIRA done.\n');

    // ══════════════════════════════════════════════════════
    // BOARD 6: DM Inquiries - Master Board (Commercial)
    // ══════════════════════════════════════════════════════
    console.log('📋 Creating: DM Inquiries - Master Board...');
    const dmBoard = await createBoard('DM Inquiries - Master Board', 'Commercial', [
      { id: 'name', title: 'Customer / Inquiry', type: 'text' },
      { id: 'status', title: 'Status', type: 'status', options: [
        { label: 'New', color: '#e2445c' },
        { label: 'Replied', color: '#fdab3d' },
        { label: 'Following Up', color: '#0085ff' },
        { label: 'Converted', color: '#00c875' },
        { label: 'Closed', color: '#c4c4c4' },
      ]},
      { id: 'source', title: 'Source', type: 'status', options: [
        { label: 'Instagram', color: '#e1306c' },
        { label: 'WhatsApp', color: '#25d366' },
        { label: 'Email', color: '#0085ff' },
        { label: 'Website', color: '#a25ddc' },
        { label: 'LinkedIn', color: '#0077b5' },
        { label: 'Referral', color: '#fdab3d' },
      ]},
      { id: 'urgency', title: 'Urgency', type: 'priority' },
      { id: 'assignedToId', title: 'Handler', type: 'person' },
      { id: 'receivedDate', title: 'Received', type: 'date' },
    ]);

    const dm1 = await createGroup(dmBoard.id, 'New Inquiries', '#e2445c');
    await createItem(dm1.id, dmBoard.id, { name: 'Sarah Johnson - SIRA Product Inquiry', status: 'New', source: 'Instagram', urgency: 'High', receivedDate: '2026-05-29', assignedToId: '1' });
    await createItem(dm1.id, dmBoard.id, { name: 'Mike Chen - Bulk Order Request', status: 'New', source: 'Email', urgency: 'Medium', receivedDate: '2026-05-29', assignedToId: '9' });
    await createItem(dm1.id, dmBoard.id, { name: 'Ahmed Al Mansoori - Pricing Query', status: 'New', source: 'WhatsApp', urgency: 'High', receivedDate: '2026-05-30', assignedToId: '1' });
    await createItem(dm1.id, dmBoard.id, { name: 'Lisa Park - Product Demo Request', status: 'New', source: 'Website', urgency: 'Medium', receivedDate: '2026-05-30', assignedToId: '9' });

    const dm2 = await createGroup(dmBoard.id, 'In Progress', '#fdab3d');
    await createItem(dm2.id, dmBoard.id, { name: 'Emma Davis - Custom Design Order', status: 'Replied', source: 'Instagram', urgency: 'Low', receivedDate: '2026-05-27', assignedToId: '1' });
    await createItem(dm2.id, dmBoard.id, { name: 'James Wilson - Quote Request', status: 'Following Up', source: 'LinkedIn', urgency: 'Medium', receivedDate: '2026-05-26', assignedToId: '9' });
    await createItem(dm2.id, dmBoard.id, { name: 'Priya Sharma - Installation Query', status: 'Replied', source: 'WhatsApp', urgency: 'High', receivedDate: '2026-05-25', assignedToId: '1' });
    await createItem(dm2.id, dmBoard.id, { name: 'Carlos Rodriguez - Partnership', status: 'Following Up', source: 'Email', urgency: 'Medium', receivedDate: '2026-05-24', assignedToId: '9' });

    const dm3 = await createGroup(dmBoard.id, 'Converted', '#00c875');
    await createItem(dm3.id, dmBoard.id, { name: 'Alex Kim - SIRA Package Deal', status: 'Converted', source: 'Referral', urgency: 'High', receivedDate: '2026-05-20', assignedToId: '1' });
    await createItem(dm3.id, dmBoard.id, { name: 'Fatima Al Rashid - Annual Contract', status: 'Converted', source: 'Instagram', urgency: 'High', receivedDate: '2026-05-18', assignedToId: '9' });
    await createItem(dm3.id, dmBoard.id, { name: 'Thomas Brown - 3 Site Installation', status: 'Converted', source: 'LinkedIn', urgency: 'Medium', receivedDate: '2026-05-15', assignedToId: '1' });

    const dm4 = await createGroup(dmBoard.id, 'Closed', '#c4c4c4');
    await createItem(dm4.id, dmBoard.id, { name: 'Robert Lee - Inquiry Cancelled', status: 'Closed', source: 'Email', urgency: 'Low', receivedDate: '2026-05-10', assignedToId: '9' });
    await createItem(dm4.id, dmBoard.id, { name: 'Nadia Hassan - Budget Mismatch', status: 'Closed', source: 'WhatsApp', urgency: 'Low', receivedDate: '2026-05-08', assignedToId: '1' });

    console.log('  ✅ DM Inquiries - Master Board done.\n');

    // ══════════════════════════════════════════════════════
    // BOARD 7: HR & People (General)
    // ══════════════════════════════════════════════════════
    console.log('📋 Creating: HR & People...');
    const hrBoard = await createBoard('HR & People', 'General', [
      { id: 'name', title: 'Task', type: 'text' },
      { id: 'status', title: 'Status', type: 'status' },
      { id: 'priority', title: 'Priority', type: 'priority' },
      { id: 'assignedToId', title: 'Owner', type: 'person' },
      { id: 'expectedSubmissionDate', title: 'Due Date', type: 'date' },
    ]);

    const hr1 = await createGroup(hrBoard.id, 'Hiring', '#579bfc');
    await createItem(hr1.id, hrBoard.id, { name: 'Senior Developer - Job Post', status: 'Done', priority: 'High', expectedSubmissionDate: '2026-05-01', assignedToId: '1' });
    await createItem(hr1.id, hrBoard.id, { name: 'Screening Resumes - Dev Role', status: 'Working on it', priority: 'High', expectedSubmissionDate: '2026-06-05', assignedToId: '1' });
    await createItem(hr1.id, hrBoard.id, { name: 'Interview - Final Round', status: 'Not Started', priority: 'High', expectedSubmissionDate: '2026-06-12', assignedToId: '1' });
    await createItem(hr1.id, hrBoard.id, { name: 'Onboarding New Hire', status: 'Not Started', priority: 'Medium', expectedSubmissionDate: '2026-06-20', assignedToId: '9' });

    const hr2 = await createGroup(hrBoard.id, 'Employee Wellbeing', '#00c875');
    await createItem(hr2.id, hrBoard.id, { name: 'Q2 Performance Reviews', status: 'Working on it', priority: 'High', expectedSubmissionDate: '2026-06-30', assignedToId: '1' });
    await createItem(hr2.id, hrBoard.id, { name: 'Team Building Event Planning', status: 'Not Started', priority: 'Low', expectedSubmissionDate: '2026-07-10', assignedToId: '9' });
    await createItem(hr2.id, hrBoard.id, { name: 'Updated Leave Policy', status: 'Done', priority: 'Medium', expectedSubmissionDate: '2026-05-15', assignedToId: '1' });

    const hr3 = await createGroup(hrBoard.id, 'Training & Development', '#fdab3d');
    await createItem(hr3.id, hrBoard.id, { name: 'React Training Workshop', status: 'Working on it', priority: 'Medium', expectedSubmissionDate: '2026-06-08', assignedToId: '3' });
    await createItem(hr3.id, hrBoard.id, { name: 'Cybersecurity Awareness Session', status: 'Not Started', priority: 'High', expectedSubmissionDate: '2026-06-15', assignedToId: '9' });
    await createItem(hr3.id, hrBoard.id, { name: 'Leadership Training - Managers', status: 'Not Started', priority: 'Medium', expectedSubmissionDate: '2026-07-01', assignedToId: '1' });

    console.log('  ✅ HR & People done.\n');

    // ══════════════════════════════════════════════════════
    // BOARD 8: Marketing Campaigns (General)
    // ══════════════════════════════════════════════════════
    console.log('📋 Creating: Marketing Campaigns...');
    const mktBoard = await createBoard('Marketing Campaigns', 'General', [
      { id: 'name', title: 'Campaign', type: 'text' },
      { id: 'status', title: 'Status', type: 'status' },
      { id: 'priority', title: 'Priority', type: 'priority' },
      { id: 'assignedToId', title: 'Owner', type: 'person' },
      { id: 'timeline', title: 'Timeline', type: 'text' },
      { id: 'progress', title: 'Progress', type: 'progress' },
    ]);

    const m1 = await createGroup(mktBoard.id, 'Social Media', '#e1306c');
    await createItem(m1.id, mktBoard.id, { name: 'Ramadan Campaign 2026', status: 'Done', priority: 'Critical', timeline: 'Mar - Apr 2026', progress: 100, assignedToId: '7' });
    await createItem(m1.id, mktBoard.id, { name: 'Summer Sale Instagram Posts', status: 'Working on it', priority: 'High', timeline: 'Jun 2026', progress: 40, assignedToId: '7' });
    await createItem(m1.id, mktBoard.id, { name: 'LinkedIn B2B Content Series', status: 'Working on it', priority: 'Medium', timeline: 'May - Jul 2026', progress: 30, assignedToId: '11' });
    await createItem(m1.id, mktBoard.id, { name: 'YouTube Product Demo Videos', status: 'Not Started', priority: 'High', timeline: 'Jul 2026', progress: 0, assignedToId: '7' });

    const m2 = await createGroup(mktBoard.id, 'Email Campaigns', '#0085ff');
    await createItem(m2.id, mktBoard.id, { name: 'Monthly Newsletter - June', status: 'Working on it', priority: 'High', timeline: 'Jun 1 2026', progress: 50, assignedToId: '11' });
    await createItem(m2.id, mktBoard.id, { name: 'Product Launch Email Blast', status: 'Not Started', priority: 'Critical', timeline: 'Jun 20 2026', progress: 0, assignedToId: '11' });
    await createItem(m2.id, mktBoard.id, { name: 'Re-engagement Campaign', status: 'Not Started', priority: 'Medium', timeline: 'Jul 2026', progress: 0, assignedToId: '7' });

    const m3 = await createGroup(mktBoard.id, 'Paid Ads', '#fdab3d');
    await createItem(m3.id, mktBoard.id, { name: 'Google Ads - Q2 Campaign', status: 'Working on it', priority: 'High', timeline: 'Apr - Jun 2026', progress: 60, assignedToId: '9' });
    await createItem(m3.id, mktBoard.id, { name: 'Meta Ads - Retargeting', status: 'Working on it', priority: 'Medium', timeline: 'May - Jun 2026', progress: 45, assignedToId: '9' });
    await createItem(m3.id, mktBoard.id, { name: 'LinkedIn Sponsored Posts', status: 'Not Started', priority: 'Low', timeline: 'Jul 2026', progress: 0, assignedToId: '11' });

    console.log('  ✅ Marketing Campaigns done.\n');

    // Final summary
    const totalBoards = await Board.count({ where: { companyId: COMPANY_ID } });
    const totalGroups = await Group.count({ where: { companyId: COMPANY_ID } });
    const totalItems = await Item.count({ where: { companyId: COMPANY_ID } });

    console.log('═══════════════════════════════════════');
    console.log('🎉 SEED COMPLETE!');
    console.log(`📋 Boards  : ${totalBoards}`);
    console.log(`📁 Groups  : ${totalGroups}`);
    console.log(`📌 Items   : ${totalItems}`);
    console.log('═══════════════════════════════════════');
    console.log('\nFolders created:');
    console.log('  📂 Active Projects  → Main Project Board, Website Redesign');
    console.log('  📂 AI & Innovation  → AI Future Projects, AI R&D Roadmap');
    console.log('  📂 Commercial       → Commercial - SIRA, DM Inquiries');
    console.log('  📂 General          → HR & People, Marketing Campaigns');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

seed();
