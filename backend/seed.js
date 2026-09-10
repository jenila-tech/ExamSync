const pool = require("./db");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  try {
    console.log("Setting up users table...");

    // Create users table if it does not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Users table created or verified.");

    // Seed default users if they don't exist
    const defaultUsers = [
      {
        name: "System Admin",
        email: "admin@exam.com",
        plainPassword: "admin123",
        role: "admin",
      },
      {
        name: "Faculty Member",
        email: "faculty@exam.com",
        plainPassword: "faculty123",
        role: "faculty",
      },
      {
        name: "Student User",
        email: "student@exam.com",
        plainPassword: "student123",
        role: "student",
      },
    ];

    for (const u of defaultUsers) {
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [u.email]
      );

      if (existingUser.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(u.plainPassword, 10);
        await pool.query(
          "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
          [u.name, u.email, hashedPassword, u.role]
        );
        console.log(`Created default ${u.role} user: ${u.email}`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await pool.end();
  }
}

seedDatabase();
