// backend/seedMongo.js - Seed default users into MongoDB using Mongoose
require('dotenv').config(); // Load .env variables (if not already loaded)
const mongoose = require('./mongo'); // ensures connection is established using existing config
const bcrypt = require('bcryptjs');
const User = require('./models/User');

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

(async () => {
  try {
    // Ensure mongoose connection (mongo.js already attempts connection)
    await mongoose.connection;

    for (const u of defaultUsers) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`User already exists: ${u.email}`);
        continue;
      }

      const hashed = await bcrypt.hash(u.plainPassword, 10);
      const newUser = new User({
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
      });
      await newUser.save();
      console.log(`Created default ${u.role} user: ${u.email}`);
    }
  } catch (err) {
    console.error('Error seeding MongoDB users:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
})();
