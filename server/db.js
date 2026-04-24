if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

const shutdown = async () => {
  try {
    await pool.end();
    console.log('✅ PostgreSQL pool has ended');
  } catch (error) {
    console.error('Error shutting down PostgreSQL pool:', error);
  }
};

module.exports = { pool, shutdown };
