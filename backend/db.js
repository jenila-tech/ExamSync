const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "exam_management",
  password: "jason@2705",
  port: 5432,
});

module.exports = pool;

