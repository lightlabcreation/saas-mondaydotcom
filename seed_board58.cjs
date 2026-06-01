const { Item, Group, Board } = require('./models');

async function run() {
  try {
    const board = await Board.findByPk(58);
    if (!board) {
      console.log('Board 58 not found. Cannot seed.');
      process.exit(1);
    }

    // Get the first group or create one
    let group = await Group.findOne({ where: { BoardId: 58 } });
    if (!group) {
      group = await Group.create({ BoardId: 58, title: 'Project Phases', color: '#579bfc', companyId: 1 });
    }

    // Clear existing items in this group
    await Item.destroy({ where: { GroupId: group.id } });
    console.log(`Cleared items in Group ${group.title} (ID: ${group.id})`);

    const events = [
      // May 1
      { name: 'Website Redesign', date: '2026-05-01', status: 'Working on it' },
      // May 2
      { name: 'Client Meeting', date: '2026-05-02', status: 'Working on it' },
      { name: 'Market Research', date: '2026-05-02', status: 'Done' },
      // May 3
      { name: 'UI/UX Planning', date: '2026-05-03', status: 'Stuck' },
      // May 4
      { name: 'Development', date: '2026-05-04', status: 'Working on it' },
      { name: 'Team Standup', date: '2026-05-04', status: 'Working on it' },
      // May 5
      { name: 'Content Writing', date: '2026-05-05', status: 'Done' },
      { name: 'Design Review', date: '2026-05-05', status: 'Working on it' },
      // May 6
      { name: 'Backend Integration', date: '2026-05-06', status: 'Working on it' },
      { name: 'Client Call', date: '2026-05-06', status: 'Working on it' },
      // May 7
      { name: 'Testing & QA', date: '2026-05-07', status: 'Done' },
      { name: 'Internal Review', date: '2026-05-07', status: 'Stuck' },
      // May 8
      { name: 'Bug Fixing', date: '2026-05-08', status: 'Working on it' },
      { name: 'Sprint Planning', date: '2026-05-08', status: 'Working on it' },
      // May 9
      { name: 'Documentation', date: '2026-05-09', status: 'Working on it' },
      { name: 'Competitor Analysis', date: '2026-05-09', status: 'Done' },
      // May 10
      { name: 'User Feedback', date: '2026-05-10', status: 'Stuck' },
      // May 11
      { name: 'Development', date: '2026-05-11', status: 'Working on it' },
      { name: 'Team Standup', date: '2026-05-11', status: 'Working on it' },
      // May 12
      { name: 'Content Writing', date: '2026-05-12', status: 'Done' },
      { name: 'Design Review', date: '2026-05-12', status: 'Working on it' },
      // May 13
      { name: 'API Integration', date: '2026-05-13', status: 'Working on it' },
      { name: 'Client Call', date: '2026-05-13', status: 'Working on it' },
      // May 14
      { name: 'Testing & QA', date: '2026-05-14', status: 'Done' },
      { name: 'Internal Review', date: '2026-05-14', status: 'Stuck' },
      // May 15
      { name: 'Deployment', date: '2026-05-15', status: 'Working on it' },
      { name: 'Sprint Review', date: '2026-05-15', status: 'Working on it' },
      // May 16
      { name: 'Documentation', date: '2026-05-16', status: 'Working on it' },
      { name: 'Report Analysis', date: '2026-05-16', status: 'Done' },
      // May 18
      { name: 'Development', date: '2026-05-18', status: 'Working on it' },
      { name: 'Team Standup', date: '2026-05-18', status: 'Working on it' },
      // May 19
      { name: 'Content Writing', date: '2026-05-19', status: 'Done' },
      { name: 'Design Review', date: '2026-05-19', status: 'Working on it' },
      // May 20
      { name: 'Backend Optimization', date: '2026-05-20', status: 'Working on it' },
      { name: 'Client Call', date: '2026-05-20', status: 'Working on it' },
      // May 21
      { name: 'Testing & QA', date: '2026-05-21', status: 'Done' },
      { name: 'Internal Review', date: '2026-05-21', status: 'Stuck' },
      // May 22
      { name: 'Bug Fixing', date: '2026-05-22', status: 'Working on it' },
      { name: 'Sprint Planning', date: '2026-05-22', status: 'Working on it' },
      // May 23
      { name: 'Documentation', date: '2026-05-23', status: 'Working on it' },
      { name: 'Competitor Analysis', date: '2026-05-23', status: 'Done' }
    ];

    console.log(`Seeding ${events.length} calendar events into Board 58...`);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const dateObj = new Date(e.date);
      const formattedDate = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;

      await Item.create({
        name: e.name,
        status: e.status,
        receivedDate: e.date,
        expectedSubmissionDate: e.date,
        timeline: `${formattedDate} - ${formattedDate}`,
        companyId: 1,
        GroupId: group.id,
        itemIdSerial: String(i + 1),
        priority: 'Medium',
        assignedToId: '1'
      });
    }

    console.log('Successfully seeded all 41 events into Board 58!');
  } catch (err) {
    console.error('Error seeding board 58:', err);
  } finally {
    process.exit();
  }
}

run();
