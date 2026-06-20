const { sequelize } = require('./models');

const createSupportTables = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const sqlTickets = `
      CREATE TABLE IF NOT EXISTS support_tickets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_number VARCHAR(30) NOT NULL UNIQUE,
          company_id INT NOT NULL DEFAULT 0,
          company_name VARCHAR(200) NOT NULL DEFAULT 'Public Inquiry',
          project_name VARCHAR(100) NOT NULL,
          user_id INT NOT NULL DEFAULT 0,
          subject VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL DEFAULT 'General Support',
          priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
          description TEXT NOT NULL,
          status ENUM('Open', 'Assigned', 'In Progress', 'Waiting For Client', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ticket_number (ticket_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const sqlMessages = `
      CREATE TABLE IF NOT EXISTS ticket_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          sender_type ENUM('client', 'admin') NOT NULL,
          sender_id INT NOT NULL DEFAULT 0,
          message TEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await sequelize.query(sqlTickets);
    console.log('Table support_tickets created or already exists.');

    await sequelize.query(sqlMessages);
    console.log('Table ticket_messages created or already exists.');

    console.log('Support tables setup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to create tables:', error);
    process.exit(1);
  }
};

createSupportTables();
